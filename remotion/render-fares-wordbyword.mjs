#!/usr/bin/env node
/**
 * Render entry for the FaresWordByWord composition (reusable Fares
 * word-by-word kinetic typography over real footage).
 *
 * Usage:
 *   node render-fares-wordbyword.mjs \
 *     --script examples/fares-wordbyword-sample.json \
 *     --clip /path/to/background.webm \
 *     [--dark-grade 0.5] [--audio voiceover.mp3] \
 *     [--output-dir /tmp/fares/render/] [--out sample.mp4]
 *
 * Script JSON format:
 *   {
 *     "duration": 9.0,
 *     "darkGrade": 0.5,            // optional, 0..1
 *     "lines": [
 *       { "text": "بتضيّع ساعات في *المونتاج؟*", "start": 0.3, "end": 3.0 },
 *       ...
 *     ]
 *   }
 *
 * Keywords wrapped in *asterisks* slam in electric red.
 * The clip is served over local HTTP with Range support because
 * chrome-headless-shell needs real 206 responses for video.
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

function serveFile(filePath, mountPath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(JSON.stringify({ error: `File not found: ${resolved}` }));
    process.exit(1);
  }
  const ext = path.extname(resolved).toLowerCase();
  const ctype =
    ext === ".mp4"
      ? "video/mp4"
      : ext === ".webm"
        ? "video/webm"
        : ext === ".mp3"
          ? "audio/mpeg"
          : "application/octet-stream";
  const server = http.createServer((req, res) => {
    const stat = fs.statSync(resolved);
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
      fs.createReadStream(resolved, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      "Content-Type": ctype,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(resolved).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      console.log(JSON.stringify({ action: "media_server", mountPath, port }));
      resolve({ server, url: `http://127.0.0.1:${port}${mountPath}` });
    });
  });
}

async function main() {
  const args = parseArgs();
  const scriptPath = args.script;
  const clipArg = args.clip;
  const outputDir = args["output-dir"] || "/tmp/fares-wordbyword/render/";
  const outName = args.out || "fares_wordbyword_sample.mp4";

  if (!scriptPath || !clipArg) {
    console.error(
      JSON.stringify({
        error: "Missing required arguments",
        usage:
          "node render-fares-wordbyword.mjs --script script.json --clip bg.webm [--dark-grade 0.5] [--audio vo.mp3] [--output-dir DIR] [--out NAME]",
      })
    );
    process.exit(1);
  }

  const scriptData = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  const lines = scriptData.lines;
  const duration = Number(scriptData.duration || 10);
  if (!Array.isArray(lines) || lines.length === 0) {
    console.error(JSON.stringify({ error: "Script JSON must contain a non-empty lines array" }));
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, outName);

  // Serve footage (+ optional audio) over HTTP with Range support.
  const clip = await serveFile(clipArg, "/clip");
  let audio = null;
  const audioArg = args.audio || scriptData.audio || "";
  if (audioArg) audio = await serveFile(audioArg, "/audio");

  console.log(JSON.stringify({ action: "bundle", status: "starting" }));
  const startBundle = Date.now();
  const serveUrl = await bundle({ entryPoint: path.resolve(__dirname, "src/index.ts") });
  console.log(
    JSON.stringify({
      action: "bundle",
      status: "complete",
      time_sec: ((Date.now() - startBundle) / 1000).toFixed(1),
    })
  );

  const browser = await openBrowser("chrome");
  try {
    const inputProps = {
      clipSrc: clip.url,
      lines,
      durationInSeconds: duration,
      darkGrade: Number(args["dark-grade"] ?? scriptData.darkGrade ?? 0.5),
      audioSrc: audio ? audio.url : "",
    };

    console.log(
      JSON.stringify({
        action: "render",
        composition: "FaresWordByWord",
        duration: `${duration}s`,
        lines: lines.length,
        status: "starting",
      })
    );
    const startRender = Date.now();

    const composition = await selectComposition({
      serveUrl,
      id: "FaresWordByWord",
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
    console.log(
      JSON.stringify({
        action: "render",
        status: "complete",
        output: outputPath,
        render_time_sec: renderTime,
        file_size_mb: fileSizeMB,
      })
    );
  } finally {
    await browser.close({ silent: true });
    clip.server.close();
    if (audio) audio.server.close();
  }

  console.log(JSON.stringify({ action: "render_complete", output: outputPath }));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  process.exit(1);
});
