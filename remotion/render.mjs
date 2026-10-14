#!/usr/bin/env node
/**
 * Bundle-once-render-many orchestrator for claude-shorts.
 *
 * Bundles the Remotion project once, opens a shared Chrome instance,
 * then renders each approved segment sequentially.
 *
 * Usage:
 *   node render.mjs \
 *     --segments /tmp/claude-shorts/approved_segments.json \
 *     --reframe /tmp/claude-shorts/reframe.json \
 *     --captions /tmp/claude-shorts/transcript.json \
 *     --style bold \
 *     --clips-dir /tmp/claude-shorts/clips/ \
 *     --output-dir /tmp/claude-shorts/render/
 *
 * News style extras:
 *   --style news --lang fr|de [--cta "CUSTOM TEXT"] [--title "TITLE"]
 * CTA defaults: FR "VOUS EN PENSEZ QUOI ?", DE "WAS DENKT IHR?"
 * Per-segment JSON may carry: badge_text, badge_at (sec), teaser_end (sec).
 * A publish-package.json (title/hook/badge/cta) is written to the output dir.
 *
 * IMPORTANT: Uses selectComposition() before renderMedia() to resolve
 * calculateMetadata (dynamic duration per segment).
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

  const segmentsPath = args.segments;
  const reframePath = args.reframe;
  const captionsPath = args.captions;
  const style = args.style || "bold";
  const clipsDir = args["clips-dir"];
  const outputDir = args["output-dir"] || "/tmp/claude-shorts/render/";
  const lang = (args.lang || "fr").toLowerCase();
  const title = args.title || "";
  const CTA_DEFAULTS = {
    fr: "VOUS EN PENSEZ QUOI ?",
    de: "WAS DENKT IHR?",
  };
  const ctaText = args.cta || CTA_DEFAULTS[lang] || CTA_DEFAULTS.fr;

  if (!segmentsPath || !reframePath || !captionsPath || !clipsDir) {
    console.error(JSON.stringify({
      error: "Missing required arguments",
      usage: "node render.mjs --segments FILE --reframe FILE --captions FILE --clips-dir DIR [--style bold|bounce|clean|news] [--lang fr|de] [--cta TEXT] [--title TEXT] [--output-dir DIR]",
    }));
    process.exit(1);
  }

  // Load data files
  const segmentsData = JSON.parse(fs.readFileSync(segmentsPath, "utf-8"));
  const reframeData = JSON.parse(fs.readFileSync(reframePath, "utf-8"));
  const transcriptData = JSON.parse(fs.readFileSync(captionsPath, "utf-8"));

  const segments = segmentsData.segments;
  const allCaptions = transcriptData.captions;

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Start a local HTTP server to serve clip files.
  // Remotion's renderer proxy only supports http/https URLs, not file://.
  const clipServer = http.createServer((req, res) => {
    const filePath = path.join(clipsDir, decodeURIComponent(req.url.slice(1)));
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const ctype = ext === ".webm" ? "video/webm" : "video/mp4";
    const stat = fs.statSync(filePath);
    const total = stat.size;
    const range = req.headers.range;
    if (range) {
      // Proper 206 Partial Content: OffthreadVideo seeks frame-accurately
      // and renders black frames when range requests are ignored.
      const m = range.match(/bytes=(\d*)-(\d*)/);
      let start = m[1] === "" ? 0 : parseInt(m[1], 10);
      let end = m[2] === "" ? total - 1 : parseInt(m[2], 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= total) {
        res.writeHead(416, { "Content-Range": `bytes */${total}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        "Content-Type": ctype,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": end - start + 1,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": ctype, "Accept-Ranges": "bytes", "Content-Length": total });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  await new Promise((resolve) => clipServer.listen(0, "127.0.0.1", resolve));
  const clipServerPort = clipServer.address().port;
  const clipBaseUrl = `http://127.0.0.1:${clipServerPort}`;
  console.log(JSON.stringify({ action: "clip_server", port: clipServerPort, url: clipBaseUrl }));

  console.log(JSON.stringify({ action: "bundle", status: "starting" }));
  const startBundle = Date.now();

  // Bundle once
  const serveUrl = await bundle({
    entryPoint: path.resolve(__dirname, "src/index.ts"),
  });

  const bundleTime = ((Date.now() - startBundle) / 1000).toFixed(1);
  console.log(JSON.stringify({ action: "bundle", status: "complete", time_sec: bundleTime }));

  // Open shared browser instance
  const browser = await openBrowser("chrome");

  const results = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segId = seg.id ?? (i + 1);
      let clipName = `clip_${String(segId).padStart(2, "0")}.mp4`;
      let clipPath = path.resolve(clipsDir, clipName);
      if (!fs.existsSync(clipPath)) {
        // VP9/WebM transcodes (decodable by chrome-headless-shell)
        const webmName = `clip_${String(segId).padStart(2, "0")}.webm`;
        const webmPath = path.resolve(clipsDir, webmName);
        if (fs.existsSync(webmPath)) {
          clipName = webmName;
          clipPath = webmPath;
        }
      }
      const outputPath = path.resolve(outputDir, `short_${String(segId).padStart(2, "0")}.mp4`);

      if (!fs.existsSync(clipPath)) {
        console.error(JSON.stringify({ error: `Clip not found: ${clipPath}` }));
        continue;
      }

      // Get reframe data for this clip (reframe JSONs key clips by .mp4 name)
      const reframeKey = clipName.replace(/\.webm$/, ".mp4");
      const reframe = reframeData.clips?.[reframeKey] || {};
      if (!reframe.crop) {
        console.error(JSON.stringify({
          warning: `No reframe data for ${clipName}, using default 9:16 center crop for 1920x1080`,
        }));
      }
      const crop = reframe.crop || { x: 0, y: 0, w: 607, h: 1080 };
      const cropKeyframes = reframe.crop_keyframes || [];

      // Get source resolution from reframe data
      const [srcW, srcH] = (reframe.source_resolution || "1920x1080")
        .split("x")
        .map(Number);

      // Extract captions for this segment's time range (in milliseconds)
      const segStartMs = seg.start * 1000;
      const segEndMs = seg.end * 1000;
      const segCaptions = allCaptions
        .filter((c) => c.startMs >= segStartMs && c.endMs <= segEndMs)
        .map((c) => ({
          text: c.text,
          startMs: c.startMs - segStartMs, // Offset to clip-local time
          endMs: c.endMs - segStartMs,
        }));

      const durationInSeconds = seg.end - seg.start;

      const inputProps = {
        clipSrc: `${clipBaseUrl}/${clipName}`,
        sourceWidth: srcW,
        sourceHeight: srcH,
        crop,
        cropKeyframes,
        captions: segCaptions,
        captionStyle: style,
        hookLine1: seg.hook_line1 || "",
        hookLine2: seg.hook_line2 || "",
        showProgressBar: true,
        durationInSeconds,
        // News-style extras (ignored by other styles)
        ctaText: style === "news" ? ctaText : "",
        badgeText: seg.badge_text || "",
        badgeAtSec: Number(seg.badge_at || 0),
        teaserEndSec: Number(seg.teaser_end || 0),
      };

      console.log(JSON.stringify({
        action: "render",
        segment: i + 1,
        total: segments.length,
        duration: `${durationInSeconds.toFixed(1)}s`,
        status: "starting",
      }));

      // Retry once on failure before skipping this segment
      let rendered = false;
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const startRender = Date.now();

          // selectComposition resolves calculateMetadata for dynamic duration
          const composition = await selectComposition({
            serveUrl,
            id: "ShortVideo",
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

          const result = {
            action: "render",
            segment: i + 1,
            output: outputPath,
            duration: `${durationInSeconds.toFixed(1)}s`,
            render_time_sec: renderTime,
            file_size_mb: fileSizeMB,
            status: "complete",
          };

          results.push(result);
          console.log(JSON.stringify(result));
          rendered = true;
          break;
        } catch (renderErr) {
          if (attempt < maxAttempts) {
            console.log(JSON.stringify({
              action: "render",
              segment: i + 1,
              status: "retrying",
              attempt,
              error: renderErr.message,
            }));
          } else {
            console.error(JSON.stringify({
              action: "render",
              segment: i + 1,
              status: "failed",
              error: renderErr.message,
            }));
          }
        }
      }

      if (!rendered) {
        results.push({
          action: "render",
          segment: i + 1,
          output: outputPath,
          status: "failed",
        });
      }
    }
  } finally {
    await browser.close({ silent: true });
    clipServer.close();
  }

  // ---- Publishing package (news workflow: title/hook/badge/cta per clip)
  const publishPackage = {
    title,
    language: lang,
    style,
    generated_at: new Date().toISOString(),
    clips: results
      .filter((r) => r.status === "complete")
      .map((r, idx) => {
        const seg = segments[idx] || {};
        return {
          file: r.output,
          duration: r.duration,
          hook: seg.hook_line1 || "",
          hook_sub: seg.hook_line2 || "",
          badge: seg.badge_text || "",
          cta: style === "news" ? ctaText : "",
          source_start: seg.start,
          source_end: seg.end,
        };
      }),
  };
  try {
    fs.writeFileSync(
      path.resolve(outputDir, "publish-package.json"),
      JSON.stringify(publishPackage, null, 2)
    );
    console.log(JSON.stringify({ action: "publish_package", path: path.resolve(outputDir, "publish-package.json") }));
  } catch (e) {
    console.error(JSON.stringify({ warning: `Could not write publish-package.json: ${e.message}` }));
  }

  // Final summary
  console.log(JSON.stringify({
    action: "render_complete",
    segments_rendered: results.length,
    total_segments: segments.length,
    output_dir: outputDir,
    results,
  }));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  process.exit(1);
});
