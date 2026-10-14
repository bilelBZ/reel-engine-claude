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
 * Per-segment JSON may carry: badge_text, badge_at (sec).
 *
 * Face-tracked speaker centering:
 *   --reframe-mode face-track
 * Runs scripts/face_track_keyframes.py (mediapipe) on the exact clip being
 * rendered and replaces the reframe crop.x / crop_keyframes with a smoothed
 * face-tracked pan that keeps the speaker horizontally centered in the 9:16
 * crop. Picks the largest/most-persistent face, carries forward on gaps,
 * falls back to frame center. Result is cached as <clip>.facetrack.json.
 * Also honored as top-level "reframe_mode" in the reframe JSON.
 * Teaser (news style): a segment may carry teaser_start + teaser_end
 * (source-absolute seconds). The workflow must place the teaser extract in
 * clips-dir as clip_NN_teaser.mp4 (or .webm) next to clip_NN.mp4; render.mjs
 * pre-concatenates teaser+passage into ONE clip and renders ONCE, so the
 * hook (0.15-3.4s), badge and CTA fire exactly once on the final timeline.
 * NEVER render teaser and passage as two Remotion renders and concatenate
 * the outputs — that duplicates every overlay (hook bar twice, badge twice).
 * A publish-package.json (title/hook/badge/cta) is written to the output dir.
 *
 * Embedded cover (news style, on by default; --cover 0 disables): the first
 * 1.2s show a generated title card — scripts/make_cover.py picks a
 * face-centered frame from the content clip (via the face-track keyframes)
 * and overlays the hook text oversized in Anton (key word in yellow) — so
 * the reel cover Facebook picks from the video frames is always strong.
 * The content (video + captions) is delayed behind the cover via a
 * <Sequence> in ShortVideo, so captions and crop keyframes stay
 * content-local; only absolute-timed overlays (hook 0.15-3.4s, badge,
 * teaser flash) shift by the cover length. Segment JSON may carry
 * hook_highlight (yellow word on the cover); default is the longest word.
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
import { execSync, execFileSync } from "child_process";

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
      usage: "node render.mjs --segments FILE --reframe FILE --captions FILE --clips-dir DIR [--style bold|bounce|clean|news] [--lang fr|de] [--cta TEXT] [--title TEXT] [--output-dir DIR] [--reframe-mode face-track]",
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
    const ctype = ext === ".webm" ? "video/webm" : ext === ".png" ? "image/png" : "video/mp4";
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
      const base = `clip_${String(segId).padStart(2, "0")}`;
      const outputPath = path.resolve(outputDir, `short_${String(segId).padStart(2, "0")}.mp4`);

      const resolveClip = (name) => {
        // Prefers .mp4, falls back to .webm (VP9 transcodes for chrome-headless-shell)
        for (const ext of [".mp4", ".webm"]) {
          const p = path.resolve(clipsDir, name + ext);
          if (fs.existsSync(p)) return { clipName: name + ext, clipPath: p };
        }
        return null;
      };

      let clipName, clipPath, reframeKey, segCaptions, durationInSeconds, teaserEndSec;

      // ---- Teaser support (news style) ----
      // A segment may prepend a teaser passage via teaser_start/teaser_end
      // (source-absolute seconds). The teaser MUST be pre-concatenated into
      // the render timeline: rendering teaser and passage as two separate
      // Remotion renders and concatenating the outputs duplicates every
      // overlay (hook bar twice with two texts, badge twice, ...). Here we
      // build ONE combined clip and render ONCE, so hook/badge/CTA fire
      // exactly once on the final timeline.
      // The workflow must place the teaser extract in clips-dir as
      // clip_NN_teaser.mp4 (or .webm) next to clip_NN.mp4.
      const hasTeaser = seg.teaser_start != null && seg.teaser_end != null;
      if (hasTeaser) {
        const teaserDur = seg.teaser_end - seg.teaser_start;
        if (!(teaserDur > 0)) {
          console.error(JSON.stringify({ error: `Segment ${segId}: invalid teaser range ${seg.teaser_start}-${seg.teaser_end}` }));
          continue;
        }
        const teaserClip = resolveClip(`${base}_teaser`);
        if (!teaserClip) {
          console.error(JSON.stringify({ error: `Segment ${segId}: teaser clip not found — expected ${base}_teaser.mp4/.webm in ${clipsDir}. Refusing to render without the teaser; a missing teaser must never silently change the timeline.` }));
          continue;
        }
        const mainClip = resolveClip(base);
        if (!mainClip) {
          console.error(JSON.stringify({ error: `Clip not found: ${path.resolve(clipsDir, base + ".mp4")}` }));
          continue;
        }

        // Concat teaser + passage (stream copy: both are extracts of one source)
        const combinedBase = `${base}_combined`;
        const listFile = path.resolve(clipsDir, `${combinedBase}.txt`);
        const combinedMp4 = path.resolve(clipsDir, `${combinedBase}.mp4`);
        fs.writeFileSync(listFile, `file '${teaserClip.clipPath}'\nfile '${mainClip.clipPath}'\n`);
        execSync(`ffmpeg -y -v error -f concat -safe 0 -i "${listFile}" -c copy "${combinedMp4}"`);
        // VP9/WebM transcode: chrome-headless-shell cannot decode H.264
        const combinedWebm = path.resolve(clipsDir, `${combinedBase}.webm`);
        execSync(`ffmpeg -y -v error -i "${combinedMp4}" -c:v libvpx-vp9 -crf 28 -b:v 0 -c:a libopus "${combinedWebm}"`);

        clipName = `${combinedBase}.webm`;
        clipPath = combinedWebm;
        // Teaser and passage come from the same source video: one reframe fits both
        reframeKey = `${base}.mp4`;

        const tStartMs = seg.teaser_start * 1000;
        const segStartMs = seg.start * 1000;
        const segEndMs = seg.end * 1000;
        const tEndMs = seg.teaser_end * 1000;
        const teaserCaps = allCaptions
          .filter((c) => c.startMs >= tStartMs && c.endMs <= tEndMs)
          .map((c) => ({ text: c.text, startMs: c.startMs - tStartMs, endMs: c.endMs - tStartMs }));
        const mainCaps = allCaptions
          .filter((c) => c.startMs >= segStartMs && c.endMs <= segEndMs)
          .map((c) => ({
            text: c.text,
            startMs: c.startMs - segStartMs + teaserDur * 1000,
            endMs: c.endMs - segStartMs + teaserDur * 1000,
          }));
        segCaptions = [...teaserCaps, ...mainCaps];
        durationInSeconds = teaserDur + (seg.end - seg.start);
        teaserEndSec = teaserDur;
      } else {
        const found = resolveClip(base);
        if (!found) {
          console.error(JSON.stringify({ error: `Clip not found: ${path.resolve(clipsDir, base + ".mp4")}` }));
          continue;
        }
        ({ clipName, clipPath } = found);
        reframeKey = clipName.replace(/\.webm$/, ".mp4");

        // Extract captions for this segment's time range (in milliseconds)
        const segStartMs = seg.start * 1000;
        const segEndMs = seg.end * 1000;
        segCaptions = allCaptions
          .filter((c) => c.startMs >= segStartMs && c.endMs <= segEndMs)
          .map((c) => ({
            text: c.text,
            startMs: c.startMs - segStartMs, // Offset to clip-local time
            endMs: c.endMs - segStartMs,
          }));

        durationInSeconds = seg.end - seg.start;
        // Legacy field: explicit teaser flash point (sec) without a teaser clip
        teaserEndSec = Number(seg.teaser_end || 0);
      }

      // Get reframe data for this clip (reframe JSONs key clips by .mp4 name;
      // teaser+passage combos reuse the main clip's reframe — same source video)
      const reframe = reframeData.clips?.[reframeKey] || {};
      if (!reframe.crop) {
        console.error(JSON.stringify({
          warning: `No reframe data for ${clipName}, using default 9:16 center crop for 1920x1080`,
        }));
      }
      const crop = reframe.crop || { x: 0, y: 0, w: 607, h: 1080 };
      let cropKeyframes = reframe.crop_keyframes || [];

      // ---- Face-tracked speaker centering (optional reframe mode) ----
      // --reframe-mode face-track (or reframe JSON top-level "reframe_mode"):
      // runs scripts/face_track_keyframes.py on the exact clip being rendered
      // (the pre-concatenated combined clip for teaser segments) and swaps in
      // the smoothed face-tracked crop + pan keyframes, so the speaker stays
      // horizontally centered in the 9:16 frame automatically.
      const reframeMode = (args["reframe-mode"] || reframeData.reframe_mode || "").toLowerCase();
      const scriptsDir = path.resolve(__dirname, "../scripts");
      const venvPy = path.join(process.env.HOME || "~", ".shorts-skill/bin/python");
      const pyBin = fs.existsSync(venvPy) ? venvPy : "python3";
      const ftCachePath = `${clipPath}.facetrack.json`;
      if (reframeMode === "face-track") {
        try {
          const scriptPath = path.resolve(scriptsDir, "face_track_keyframes.py");
          const cachePath = ftCachePath;
          const cacheFresh = fs.existsSync(cachePath) &&
            fs.statSync(cachePath).mtimeMs >= fs.statSync(clipPath).mtimeMs;
          if (!cacheFresh) {
            execFileSync(pyBin, [scriptPath, "--clip", clipPath, "--out", cachePath], { stdio: "pipe" });
          }
          const ft = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
          if (ft.crop && ft.crop_keyframes && ft.crop_keyframes.length > 0) {
            crop.x = ft.crop.x;
            crop.y = ft.crop.y;
            crop.w = ft.crop.w;
            crop.h = ft.crop.h;
            cropKeyframes = ft.crop_keyframes;
            console.log(JSON.stringify({
              action: "face_track",
              segment: i + 1,
              keyframes: cropKeyframes.length,
              detections: ft.meta?.detections,
              samples: ft.meta?.samples,
              fallback_to_center: ft.meta?.fallback_to_center,
            }));
          } else {
            console.error(JSON.stringify({ warning: `face-track produced no keyframes for ${clipName}; keeping reframe.json crop` }));
          }
        } catch (ftErr) {
          console.error(JSON.stringify({ warning: `face-track failed for ${clipName} (${ftErr.message}); keeping reframe.json crop` }));
        }
      }

      // ---- Embedded cover / title card (news style) ----
      // The first COVER_SEC seconds show a generated cover PNG (face-centered
      // speaker frame + oversized hook text, via scripts/make_cover.py) so the
      // reel cover Facebook picks from the video frames is always strong —
      // no manual cover selection in the app. The content (video + captions)
      // is delayed behind the cover via <Sequence> in ShortVideo, so
      // captions and crop keyframes stay content-local; only absolute-timed
      // overlays (hook, badge, teaser flash) shift by coverSec. Disable with
      // --cover 0. The segment JSON may carry hook_highlight (word rendered
      // in yellow on the cover); default is the longest hook word.
      const COVER_SEC = 1.2;
      let coverImageSrc = "";
      let coverSec = 0;
      const wantCover = style === "news" && args.cover !== "0";
      if (wantCover) {
        try {
          if (!fs.existsSync(ftCachePath)) {
            execFileSync(pyBin, [
              path.resolve(scriptsDir, "face_track_keyframes.py"),
              "--clip", clipPath, "--out", ftCachePath,
            ], { stdio: "pipe" });
          }
          // Cover frame: 40% into the passage (content-local seconds)
          const contentDur = durationInSeconds;
          const passageStart = teaserEndSec || 0;
          const tCover = Math.max(0.5, Math.min(
            contentDur - 0.5,
            passageStart + Math.max(0, (contentDur - passageStart)) * 0.4
          ));
          const coverName = `cover_${String(segId).padStart(2, "0")}.png`;
          const coverPath = path.resolve(clipsDir, coverName);
          const hookText = seg.hook_line1 || title || "";
          if (!hookText) throw new Error("no hook text available for cover");
          execFileSync(pyBin, [
            path.resolve(scriptsDir, "make_cover.py"),
            "--clip", clipPath,
            "--at", tCover.toFixed(2),
            "--facetrack", ftCachePath,
            "--hook", hookText,
            "--highlight", seg.hook_highlight || "",
            "--out", coverPath,
          ], { stdio: "pipe" });
          coverImageSrc = `${clipBaseUrl}/${coverName}`;
          coverSec = COVER_SEC;
          console.log(JSON.stringify({
            action: "cover", segment: i + 1, at_sec: Number(tCover.toFixed(2)), out: coverPath,
          }));
        } catch (coverErr) {
          console.error(JSON.stringify({
            warning: `cover generation failed for segment ${i + 1} (${coverErr.message}); rendering without cover`,
          }));
        }
      }
      if (coverSec > 0) {
        durationInSeconds += coverSec;
        teaserEndSec += coverSec;
      }

      // Get source resolution from reframe data
      const [srcW, srcH] = (reframe.source_resolution || "1920x1080")
        .split("x")
        .map(Number);

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
        badgeAtSec: Number(seg.badge_at || 0) + coverSec,
        teaserEndSec: teaserEndSec,
        coverImageSrc,
        coverSec,
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
