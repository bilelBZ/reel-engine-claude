#!/usr/bin/env node
/**
 * Render entry for the ScriptCards style (Say It Save It money scripts).
 * Pure kinetic text cards — no footage, no voiceover, no audio bed.
 *
 * Usage:
 *   node render-script.mjs \
 *     --script remotion/examples/script-cards-internet-bill.json \
 *     [--output-dir /home/hatch/tmp/script-cards/render/] \
 *     [--out short_01.mp4]
 *
 * Script JSON format:
 *   {
 *     "duration": 37.3,
 *     "brand": "SAY IT SAVE IT",
 *     "scenes": [
 *       { "type": "hook", "start": 0, "end": 3.2,
 *         "lines": ["7 SENTENCES THAT", "SLASH YOUR $85", "INTERNET BILL"],
 *         "accentLines": [1] },
 *       { "type": "sentence", "start": 3.2, "end": 7.5, "number": 1,
 *         "lines": ["Hi, I'd like to lower my internet bill."],
 *         "highlightWords": ["lower"] },
 *       { "type": "cta", "start": 33.3, "end": 37.3,
 *         "lines": ["SAVE THIS BEFORE", "YOUR NEXT BILL", "FOLLOW FOR DAILY MONEY SCRIPTS"] }
 *     ]
 *   }
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
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
  const outputDir = args["output-dir"] || "/home/hatch/tmp/script-cards/render/";
  const outName = args.out || "short_01.mp4";

  if (!scriptPath) {
    console.error(JSON.stringify({
      error: "Missing required argument",
      usage: "node render-script.mjs --script script.json [--output-dir DIR] [--out NAME]",
    }));
    process.exit(1);
  }

  const scriptData = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  const scenes = scriptData.scenes;
  const duration = Number(scriptData.duration || 30);
  if (!Array.isArray(scenes) || scenes.length === 0) {
    console.error(JSON.stringify({ error: "Script JSON must contain a non-empty scenes array" }));
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, outName);

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
      brand: scriptData.brand || "SAY IT SAVE IT",
      audioSrc: "",
    };

    console.log(JSON.stringify({
      action: "render",
      composition: "ScriptCards",
      duration: `${duration}s`,
      scenes: scenes.length,
      status: "starting",
    }));
    const startRender = Date.now();

    const composition = await selectComposition({
      serveUrl,
      id: "ScriptCards",
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
  }

  console.log(JSON.stringify({ action: "render_complete", output: outputPath }));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  process.exit(1);
});
