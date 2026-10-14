#!/usr/bin/env python3
"""Generate an embedded cover/title card PNG for a news-style reel.

Picks a face-centered frame from the content clip (using the face-track
keyframes when available, else a center crop), then overlays the hook text
OVERSIZED in Anton (white with black stroke, highlight word in yellow) —
the same visual language as the video's hook bar, as a title card.

Usage:
    python3 make_cover.py --clip /path/clip.webm --at 14.6 \
        --facetrack /path/clip.webm.facetrack.json \
        --hook "PFLEGEHEIM FRISST ERSPARNISSE AUF" --highlight "FRISST" \
        --out /path/cover_01.png

Output: 1080x1920 PNG.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile


def ensure_anton_ttf():
    """Convert the vendored Anton woff2 to TTF (cached in TMPDIR)."""
    tmpdir = os.environ.get("TMPDIR", "/tmp")
    ttf = os.path.join(tmpdir, "Anton-Regular.ttf")
    if os.path.exists(ttf):
        return ttf
    here = os.path.dirname(os.path.abspath(__file__))
    woff2 = os.path.join(here, "..", "remotion", "public", "fonts", "Anton-Regular.woff2")
    if not os.path.exists(woff2):
        # fall back: search the repo
        import glob
        hits = glob.glob(os.path.join(here, "..", "**", "Anton-Regular.woff2"), recursive=True)
        if not hits:
            raise FileNotFoundError("Anton-Regular.woff2 not found")
        woff2 = hits[0]
    from fontTools.ttLib import TTFont
    f = TTFont(woff2)
    f.flavor = None
    f.save(ttf)
    return ttf


def interp_keyframes(keyframes, t):
    xs = [(k["t"], k["x"]) for k in keyframes]
    if t <= xs[0][0]:
        return xs[0][1]
    for (t0, x0), (t1, x1) in zip(xs, xs[1:]):
        if t0 <= t <= t1:
            a = (t - t0) / max(1e-6, t1 - t0)
            return x0 + a * (x1 - x0)
    return xs[-1][1]


def extract_frame(clip, at_sec, tmpdir):
    out = os.path.join(tmpdir, "cover_frame.png")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-ss", str(at_sec), "-i", clip,
         "-frames:v", "1", out],
        check=True,
    )
    return out


def wrap_hook(text, max_chars=15):
    words = text.upper().split()
    lines, cur = [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        if len(cand) <= max_chars or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main():
    ap = argparse.ArgumentParser(description="Generate news-reel cover card PNG")
    ap.add_argument("--clip", required=True)
    ap.add_argument("--at", type=float, required=True, help="Content-local seconds for the frame")
    ap.add_argument("--facetrack", default="", help="face_track_keyframes.py JSON (optional)")
    ap.add_argument("--hook", required=True, help="Hook text, e.g. PFLEGEHEIM FRISST ERSPARNISSE AUF")
    ap.add_argument("--highlight", default="", help="Word to render in yellow (default: longest word)")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    from PIL import Image, ImageDraw, ImageFont
    import numpy as np

    W, H = 1080, 1920

    # ---- crop box (face-tracked when available) ----
    crop = {"x": 0, "y": 0, "w": 0, "h": 0}
    keyframes = []
    if args.facetrack and os.path.exists(args.facetrack):
        ft = json.load(open(args.facetrack))
        crop = ft["crop"]
        keyframes = ft.get("crop_keyframes", [])

    tmpdir = tempfile.mkdtemp(prefix="cover_")
    frame_path = extract_frame(args.clip, args.at, tmpdir)
    frame = Image.open(frame_path).convert("RGB")
    fw, fh = frame.size

    if crop["w"] > 0:
        cx = int(interp_keyframes(keyframes, args.at)) if keyframes else int(crop["x"])
        cx = max(0, min(fw - int(crop["w"]), cx))
        box = (cx, int(crop["y"]), cx + int(crop["w"]), int(crop["y"]) + int(crop["h"]))
        base = frame.crop(box).resize((W, H), Image.LANCZOS)
    else:
        # center-crop fallback to 9:16
        target_ratio = 9 / 16
        if fw / fh > target_ratio:
            nw = int(fh * target_ratio)
            x0 = (fw - nw) // 2
            base = frame.crop((x0, 0, x0 + nw, fh)).resize((W, H), Image.LANCZOS)
        else:
            nh = int(fw / target_ratio)
            y0 = (fh - nh) // 2
            base = frame.crop((0, y0, fw, y0 + nh)).resize((W, H), Image.LANCZOS)

    # ---- top gradient for headline contrast ----
    grad_h = 760
    overlay = Image.new("L", (1, grad_h), 0)
    px = overlay.load()
    for y in range(grad_h):
        px[0, y] = int(155 * (1 - y / grad_h) ** 1.5)
    grad = overlay.resize((W, grad_h))
    black = Image.new("RGB", (W, grad_h), (0, 0, 0))
    base.paste(Image.composite(black, base.crop((0, 0, W, grad_h)), grad), (0, 0))

    # ---- headline ----
    ttf = ensure_anton_ttf()
    lines = wrap_hook(args.hook)
    big = max(len(l) for l in lines) <= 10
    font = ImageFont.truetype(ttf, 150 if big else 118)
    WHITE, YELLOW, BLACK = (255, 255, 255), (255, 215, 0), (0, 0, 0)
    hl = (args.highlight or "").upper() or None
    if hl is None:
        hl = max(args.hook.upper().split(), key=len)

    d = ImageDraw.Draw(base)
    stroke = 5
    y = 150
    for line in lines:
        segs = [(w + " ", YELLOW if w == hl else WHITE) for w in line.split()]
        widths = []
        for txt, _ in segs:
            bb = d.textbbox((0, 0), txt, font=font, stroke_width=stroke)
            widths.append(bb[2] - bb[0])
        x = (W - sum(widths)) / 2
        for (txt, fill), wpx in zip(segs, widths):
            d.text((x, y), txt, font=font, fill=fill, stroke_width=stroke, stroke_fill=BLACK)
            x += wpx
        bb = d.textbbox((0, 0), line, font=font)
        y += (bb[3] - bb[1]) + 18

    base.save(args.out)
    print(json.dumps({"cover": args.out, "at": args.at, "lines": lines, "highlight": hl}))


if __name__ == "__main__":
    main()
