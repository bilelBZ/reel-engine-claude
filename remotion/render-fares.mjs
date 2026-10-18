#!/usr/bin/env node
/**
 * Render entry for the fares-kinetic style (Fares Editorial port).
 *
 * Usage:
 *   node render-fares.mjs \
 *     --script /tmp/fares/script.json \
 *     [--audio /tmp/fares/voiceover.mp3] \
 *     [--output-dir /tmp/fares/render/] \
 *     [--out promo.mp4]
 *
 * Script JSON format:
 *   {
 *     "duration": 28.0,
 *     "scenes": [
 *       { "start": 0, "end": 2.65, "hero": "hourglass",
 *         "lines": ["تضيّع ساعات في *المنتاج؟*"] },
 *       ...
 *     ]
 *   }
 *
 * Hero kinds: hourglass | film | textlines | eye | wand | robot | rocket
 * Keywords wrapped in *asterisks* slam in electric red.
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    parsed[key] = args[i + 1];
  }
  return parsed;
}

async function main() {
  const args = parseArgs();
  const scriptPath = args.script;
  const audioArg = args.audio || "";
  const outputDir = args["output-dir"] || "/tmp/fares-kinetic/render/";
  const outName = args.out || "fares_01.mp4";

  if (!scriptPath) {
    console.error(JSON.stringify({
      error: "Missing required argument",
      usage: "node render-fares.mjs --script script.json [--audio voiceover.mp3] [--output-dir DIR] [--out NAME]",
    }));
    process.exit(1);
  }

  const scriptData = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  const scenes = scriptData.scenes;
  const duration = Number(scriptData.duration || 28);
  if (!Array.isArray(scenes) || scenes.length === 0) {
    console.error(JSON.stringify({ error: "Script JSON must contain a non-empty scenes array" }));
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, outName);

  // Serve a local audio file (if any) over HTTP for the renderer.
  let audioSrc = audioArg || scriptData.audio || "";
  let audioServer = null;
  if (audioSrc && !audioSrc.startsWith("http")) {
    const audioPath = path.resolve(audioSrc);
    if (!fs.existsSync(audioPath)) {
      console.error(JSON.stringify({ error: `Audio file not found: ${audioPath}` }));
      process.exit(1);
    }
    audioServer = http.createServer((req, res) => {
      const stat = fs.statSync(audioPath);
      const ext = path.extname(audioPath).toLowerCase();
      const ctype = ext === ".mp3" ? "audio/mpeg" : ext === ".wav" ? "audio/wav" : "audio/mp4";
      const range = req.headers.range;
      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
        res.writeHead(206, {
          "Content-Type": ctype,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": end - start + 1,
          "Accept-Ranges": "bytes",
        });
        fs.createReadStream(audioPath, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, {
        "Content-Type": ctype,
        "Content-Length": stat.size,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(audioPath).pipe(res);
    });
    await new Promise((resolve) => audioServer.listen(0, "127.0.0.1", resolve));
    const port = audioServer.address().port;
    audioSrc = `http://127.0.0.1:${port}/audio${path.extname(audioPath)}`;
    console.log(JSON.stringify({ action: "audio_server", port }));
  }

  console.log(JSON.stringify({ action: "bundle", status: "starting" }));
  const startBundle = Date.now();
  const serveUrl = await bundle({ entryPoint: path.resolve(__dirname, "src/index.ts") });
  console.log(JSON.stringify({
    action: "bundle",
    status: "complete",
    time_sec: ((Date.now() - startBundle) / 1000).toFixed(1),
  }));

  const browser = await openBrowser("chrome");
  try {
    const inputProps = {
      script: scenes,
      durationInSeconds: duration,
      audioSrc,
    };

    console.log(JSON.stringify({
      action: "render",
      composition: "FaresKinetic",
      duration: `${duration}s`,
      scenes: scenes.length,
      status: "starting",
    }));
    const startRender = Date.now();

    const composition = await selectComposition({
      serveUrl,
      id: "FaresKinetic",
      inputProps,
      puppeteerInstance: browser,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      crf: 18,
      outputLocation: outputPath,
      inputProps,
      puppeteerInstance: browser,
    });

    const renderTime = ((Date.now() - startRender) / 1000).toFixed(1);
    const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
    console.log(JSON.stringify({
      action: "render",
      status: "complete",
      output: outputPath,
      render_time_sec: renderTime,
      file_size_mb: fileSizeMB,
    }));
  } finally {
    await browser.close({ silent: true });
    if (audioServer) audioServer.close();
  }

  console.log(JSON.stringify({ action: "render_complete", output: outputPath }));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  process.exit(1);
});
