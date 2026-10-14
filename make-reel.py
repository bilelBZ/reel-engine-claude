#!/usr/bin/env python3
"""
make-reel.py — the easy reel tool.

YouTube URL (or local video) + timestamps in, finished 1080x1920 MP4 + publishing
package out. Fast path: transcribes ONLY the final clip (~15s), burns karaoke
captions with ffmpeg (~20s). Total ~1 minute per reel.

Usage:
  python3 make-reel.py --video <URL> --start MM:SS --end MM:SS [options]
  python3 make-reel.py --local-video <file> --start MM:SS --end MM:SS [options]

Options:
  --teaser "MM:SS-MM:SS"   highlight moment placed first (0-3s)
  --hook TEXT              top hook bar (default: auto from keywords)
  --badge TEXT             animated badge, e.g. "-18 CTS/L"
  --badge-at SEC           badge time in final clip (default: first keyword)
  --cta TEXT               end question (default per --lang)
  --lang fr|de             default fr
  --title TEXT             publishing title
  --output FILE            output MP4 (default: ./reel-<ts>.mp4)
"""
import argparse, json, os, re, subprocess, sys, time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV_PY = Path.home() / ".shorts-skill" / "bin" / "python"
CTA_DEFAULTS = {"fr": "VOUS EN PENSEZ QUOI ?", "de": "WAS DENKT IHR?"}

def ts_parse(s):
    m = re.match(r"^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$", s.strip())
    if not m:
        m2 = re.match(r"^(\d{1,2}):(\d{1,2}(?:\.\d+)?)$", s.strip())
        if not m2: raise ValueError(f"bad timestamp: {s}")
        h, mi, se = 0, int(m2.group(1)), float(m2.group(2))
    else:
        h, mi, se = int(m.group(1) or 0), int(m.group(2)), float(m.group(3))
    return h * 3600 + mi * 60 + se

def ts_ass(sec):
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print("CMD FAILED:", " ".join(cmd[:6]), file=sys.stderr)
        print(r.stderr[-1500:], file=sys.stderr)
        sys.exit(1)
    return r

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video"); ap.add_argument("--local-video")
    ap.add_argument("--start", required=True); ap.add_argument("--end", required=True)
    ap.add_argument("--teaser", default=None)
    ap.add_argument("--hook", default=None); ap.add_argument("--badge", default=None)
    ap.add_argument("--badge-at", type=float, default=None)
    ap.add_argument("--cta", default=None); ap.add_argument("--lang", default="fr")
    ap.add_argument("--title", default=""); ap.add_argument("--output", default=None)
    a = ap.parse_args()
    lang = a.lang.lower()
    t0 = time.time()

    work = Path(f"/home/hatch/tmp/reel-{datetime.now().strftime('%H%M%S')}")
    work.mkdir(parents=True, exist_ok=True)

    # 1. source
    if a.local_video:
        src = str(Path(a.local_video).resolve())
    else:
        env = {k: v for k, v in os.environ.items() if k not in ("no_proxy", "NO_PROXY")}
        src = str(work / "source.mp4")
        run([str(VENV_PY), "-m", "yt_dlp", "--no-check-certificate",
             "--extractor-args", "youtube:player_client=android",
             "-f", "bv*[height<=720]+ba/b[height<=720]/b",
             "-o", src, a.video], env=env)
    s_main, e_main = ts_parse(a.start), ts_parse(a.end)

    # 2. build clip: teaser first, then main — 9:16, 1080x1920, h264
    clip = work / "clip.mp4"
    inputs, fc_v, fc_a, maps = [], [], [], []
    base_v = ("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")
    prog = "drawbox=y=1908:w='1080*t/{t:.2f}':h=12:color=yellow:t=fill"
    if a.teaser:
        t_s, t_e = [ts_parse(x) for x in a.teaser.split("-")]
        teaser_dur = t_e - t_s
        inputs += ["-ss", str(t_s), "-to", str(t_e), "-i", src]
        inputs += ["-ss", str(s_main), "-to", str(e_main), "-i", src]
        total = teaser_dur + (e_main - s_main)
        fc_v = [f"[0:v][1:v]concat=n=2:v=1:a=0[vcat];[vcat]{base_v},{prog.format(t=total)}[v]"]
        fc_a = ["[0:a][1:a]concat=n=2:v=0:a=1[a]"]
    else:
        inputs += ["-ss", str(s_main), "-to", str(e_main), "-i", src]
        total = e_main - s_main
        fc_v = [f"{base_v},{prog.format(t=total)}[v]"]
        fc_a = ["[0:a]anull[a]"]
    fc = ";".join(fc_v) + ";" + ";".join(fc_a)
    run(["ffmpeg", "-y", "-v", "error"] + inputs +
        ["-filter_complex", fc, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(clip)])
    print(f"[1/4] clip built: {total:.1f}s", flush=True)

    # 3. transcribe ONLY the clip (fast)
    tr_json = work / "transcript.json"
    env = {k: v for k, v in os.environ.items() if k not in ("no_proxy", "NO_PROXY")}
    run([str(VENV_PY), str(ROOT / "scripts" / "transcribe.py"),
         str(clip), "--output", str(tr_json), "--model", "base", "--device", "cpu"],
        env=env)
    d = json.loads(tr_json.read_text())
    words = [(w["start"], w["end"], w["word"].strip().upper())
             for seg in d["segments"] for w in seg["words"]]
    print(f"[2/4] transcribed: {len(words)} words", flush=True)

    # 4. ASS karaoke
    CTA_START = total - 2.4
    lines, cur = [], []
    for w in words:
        trial = " ".join(x[2] for x in cur + [w])
        if len(trial) > 26 and cur:
            lines.append(cur); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(cur)
    YEL = r"{\1c&H0000FFFF&}"; WHT = r"{\1c&H00FFFFFF&}"
    ev = []
    for line in lines:
        if line[0][0] >= CTA_START - 0.3: continue
        for i, (s, e, t) in enumerate(line):
            end = line[i+1][0] if i+1 < len(line) else min(line[-1][1] + 0.15, CTA_START - 0.3)
            if end <= s or s >= CTA_START - 0.3: continue
            txt = " ".join((YEL if j == i else WHT) + t2 for j, (_, _, t2) in enumerate(line))
            ev.append(f"Dialogue: 0,{ts_ass(s)},{ts_ass(end)},Karaoke,,0,0,0,,{txt}")
    hook = a.hook or ""
    if hook: ev.append(f"Dialogue: 0,{ts_ass(0)},{ts_ass(3.5)},Hook,,0,0,0,,{hook}")
    if a.badge:
        ev.append(f"Dialogue: 0,{ts_ass(a.badge_at or 3.0)},{ts_ass((a.badge_at or 3.0)+2.5)},Badge,,0,0,0,,{a.badge}")
    cta = a.cta or CTA_DEFAULTS.get(lang, CTA_DEFAULTS["fr"])
    ev.append(f"Dialogue: 0,{ts_ass(CTA_START)},{ts_ass(total)},CTA,,0,0,0,,{cta}")
    ass = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,DejaVu Sans,64,&H00FFFFFF,&H0000FFFF,&H80000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,2,5,40,40,700,1
Style: Hook,DejaVu Sans,84,&H00000000,&H00000000,&H00000000,&H0000FFFF,-1,0,0,0,100,100,0,0,3,0,0,8,40,40,120,1
Style: Badge,DejaVu Sans,56,&H00FFFFFF,&H00FFFFFF,&H80000000,&HAA000000,-1,0,0,0,100,100,0,0,3,2,0,9,40,40,300,1
Style: CTA,DejaVu Sans,76,&H0000FFFF,&H0000FFFF,&H80000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,2,5,40,40,600,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(ev) + "\n"
    ass_path = work / "reel.ass"
    ass_path.write_text(ass)

    # 5. final render with burned captions
    out = Path(a.output) if a.output else Path(f"./reel-{datetime.now().strftime('%Y%m%d-%H%M%S')}.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(clip),
         "-vf", f"subtitles={ass_path}", "-c:v", "libx264",
         "-preset", "ultrafast", "-crf", "24", "-pix_fmt", "yuv420p",
         "-c:a", "copy", str(out)])
    dt = time.time() - t0
    print(f"[3/4] rendered {out} in {dt:.0f}s total", flush=True)

    # 6. publishing package
    pkg = {"title": a.title, "source": a.video or a.local_video,
           "clip": {"start": a.start, "end": a.end, "teaser": a.teaser},
           "hook": hook, "badge": a.badge, "cta": cta, "lang": lang,
           "output": str(out), "duration": round(total, 1)}
    pkg_path = out.with_suffix(".json")
    pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2))
    print(f"[4/4] package: {pkg_path}")
    print(f"DONE in {dt:.0f}s -> {out}")

if __name__ == "__main__":
    main()
