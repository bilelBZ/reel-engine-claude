#!/usr/bin/env node
/**
 * Render entry for the MoneyCards (dollarmindlab-style) composition.
 * Static infographic reel: scenic bg + top transformation bar +
 * numbered black-box points + bottom YES/NO CTA, with soundtrack.
 *
 * Usage:
 *   node render-dml.mjs --script remotion/examples/dml-internet-bill.json \
 *     [--output-dir /tmp/dml/render/] [--out short_01.mp4]
 *
 * Script JSON format:
 *   {
 *     "duration": 17.21,
 *     "background": "/path/to/bg.webm",
 *     "audio": "/path/to/music.mp3",
 *     "topBar": "Internet Bill: $85 → CUT",
 *     "points": ["1.\"...\"", "2.\"...\"", ...],
 *     "cta": "Got ... right now? YES or NO 👉"
 *   }
 *
 * Local files are served over a tiny HTTP server with real Range (206)
 * support — the renderer's Chromium requires http(s) URLs, not file://.
 */
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  openBrowser,
} from "@remotion/renderer";
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

const MIME = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};

function serveFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(JSON.stringify({ error: `File not found: ${resolved}` }));
    process.exit(1);
  }
  const server = http.createServer((req, res) => {
    const stat = fs.statSync(resolved);
    const ctype =
      MIME[path.extname(resolved).toLowerCase()] || "application/octet-stream";
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
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/f` });
    });
  });
}

async function main() {
  const args = parseArgs();
  if (!args.script) {
    console.error(
      JSON.stringify({ error: "Missing --script (see header for format)" })
    );
    process.exit(1);
  }
  const outputDir = args["output-dir"] || "/tmp/dml/render/";
  const outName = args.out || "short_01.mp4";
  const script = JSON.parse(fs.readFileSync(path.resolve(args.script), "utf-8"));

  for (const k of ["background", "audio", "topBar", "points", "cta"]) {
    if (script[k] === undefined || script[k] === null) {
      console.error(JSON.stringify({ error: `Script JSON missing "${k}"` }));
      process.exit(1);
    }
  }
  if (!Array.isArray(script.points) || script.points.length === 0) {
    console.error(JSON.stringify({ error: "Script JSON needs a non-empty points array" }));
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, outName);

  const bg = await serveFile(script.background);
  const au = await serveFile(script.audio);

  const inputProps = {
    bgSrc: bg.url,
    audioSrc: au.url,
    topBar: script.topBar,
    points: script.points,
    cta: script.cta,
    durationInSeconds: Number(script.duration || 17.21),
  };

  console.log(
    JSON.stringify({ action: "bundle", status: "starting", points: script.points.length })
  );
  const serveUrl = await bundle({
    entryPoint: path.join(__dirname, "src", "index.ts"),
    onProgress: () => {},
  });

  const browser = await openBrowser("chrome-headless-shell");
  try {
    const composition = await selectComposition({
      serveUrl,
      id: "MoneyCards",
      inputProps,
      puppeteerInstance: browser,
    });
    console.log(
      JSON.stringify({
        action: "render",
        status: "starting",
        duration: `${inputProps.durationInSeconds}s`,
        frames: composition.durationInFrames,
      })
    );
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      crf: 18,
      outputLocation: outputPath,
      inputProps,
      puppeteerInstance: browser,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(
            JSON.stringify({ action: "render", progress: Math.round(progress * 100) })
          );
        }
      },
    });
    console.log(JSON.stringify({ action: "done", output: outputPath }));
  } finally {
    await browser.close();
    bg.server.close();
    au.server.close();
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ error: String(e && e.stack || e) }));
  process.exit(1);
});
