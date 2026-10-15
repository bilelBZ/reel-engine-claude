#!/usr/bin/env python3
"""
Fast MoneyCards renderer — PIL overlays + ffmpeg, no Chromium.
Replicates remotion MoneyCards.tsx layout. Target: ~1 min/video.
Usage: python3 render-fast.py --script examples/xxx.json --out out.mp4
"""
import argparse, json, subprocess, textwrap, os
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FONT_BLACK = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Black.ttf"
FONT_EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"

from fontTools.ttLib import TTFont
FONT_SYMBOL = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_CMAP_MAIN = TTFont(FONT_BLACK).getBestCmap()
_CMAP_EMOJI = TTFont(FONT_EMOJI).getBestCmap()
_CMAP_SYMBOL = TTFont(FONT_SYMBOL).getBestCmap()
_EMOJI_SIZE = 109  # NotoColorEmoji strike size

def _font_for(ch):
    o = ord(ch)
    if o in _CMAP_MAIN:
        return "main"
    if o in _CMAP_EMOJI:
        return "emoji"
    if o in _CMAP_SYMBOL:
        return "symbol"
    return "main"

def font(sz):
    return ImageFont.truetype(FONT_BLACK, sz)

def _draw_emoji(img, x, y, ch, target_h):
    """Render a color-emoji char at target height, paste onto img."""
    ef = ImageFont.truetype(FONT_EMOJI, _EMOJI_SIZE)
    tmp = Image.new("RGBA", (_EMOJI_SIZE + 20, _EMOJI_SIZE + 20), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tmp)
    dt.text((10, 10), ch, font=ef, embedded_color=True)
    bbox = tmp.getbbox()
    if not bbox:
        return x
    glyph = tmp.crop(bbox)
    scale = target_h / glyph.height
    glyph = glyph.resize((max(1, int(glyph.width * scale)), target_h), Image.LANCZOS)
    img.paste(glyph, (int(x), int(y)), glyph)
    return x + glyph.width

def draw_rich(img, d, xy, text, fnt, fill):
    """Draw text with per-char font fallback (emoji/symbol)."""
    x, y = xy
    sfont = ImageFont.truetype(FONT_SYMBOL, fnt.size)
    cur, cur_kind = "", None
    def flush():
        nonlocal x, cur, cur_kind
        if not cur:
            return
        if cur_kind == "emoji":
            for ch in cur:
                x = _draw_emoji(img, x, y, ch, fnt.size)
        elif cur_kind == "symbol":
            d.text((x, y), cur, font=sfont, fill=fill)
            x += d.textlength(cur, font=sfont)
        else:
            d.text((x, y), cur, font=fnt, fill=fill)
            x += d.textlength(cur, font=fnt)
        cur = ""
    for ch in text:
        k = _font_for(ch)
        if k != cur_kind and cur:
            flush()
        cur_kind = k
        cur += ch
    flush()
    return x

def textlen_rich(d, text, fnt):
    sfont = ImageFont.truetype(FONT_SYMBOL, fnt.size)
    w, cur, cur_kind = 0.0, "", None
    for ch in text:
        k = _font_for(ch)
        if k != cur_kind and cur:
            if cur_kind == "emoji":
                w += len(cur) * fnt.size * 0.95
            elif cur_kind == "symbol":
                w += d.textlength(cur, font=sfont)
            else:
                w += d.textlength(cur, font=fnt)
            cur = ""
        cur_kind = k
        cur += ch
    if cur:
        if cur_kind == "emoji":
            w += len(cur) * fnt.size * 0.95
        elif cur_kind == "symbol":
            w += d.textlength(cur, font=sfont)
        else:
            w += d.textlength(cur, font=fnt)
    return w

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if textlen_rich(draw, t, fnt) <= max_w:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w_
    if cur: lines.append(cur)
    return lines

def rounded(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)

def render_overlay(spec):
    """Static overlay: top bar + cards + CTA (transparent PNG)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # TOP bar
    tb = spec["topBar"]
    fnt = font(88)
    lines = wrap(d, tb, fnt, W - 16 - 48)
    lh = int(88 * 1.1)
    th = len(lines) * lh + 60
    rounded(d, [8, 55, W - 8, 55 + th], 26, (255, 255, 255, 255))
    y = 55 + 30
    for ln in lines:
        tw = textlen_rich(d, ln, fnt)
        draw_rich(img, d, ((W - tw) / 2, y), ln, fnt, (0, 0, 0, 255))
        y += lh

    # BODY cards
    fnt = font(40)
    y = 300
    for pt in spec["points"]:
        lines = wrap(d, pt, fnt, 1000)
        lh = int(40 * 1.6)
        # measure block width
        bw = max(textlen_rich(d, ln, fnt) for ln in lines) + 44
        bx = (W - bw) / 2
        for ln in lines:
            tw = textlen_rich(d, ln, fnt)
            x0 = (W - tw) / 2 - 22
            rounded(d, [x0, y, x0 + tw + 44, y + lh], 16, (0, 0, 0, 255))
            draw_rich(img, d, ((W - tw) / 2, y + 8), ln, fnt, (255, 255, 255, 255))
            y += lh
        y += 26

    # CTA
    fnt = font(44)
    lines = wrap(d, spec["cta"], fnt, W - 180 - 60)
    lh = int(44 * 1.35)
    th = len(lines) * lh + 52
    y0 = H - 60 - th
    rounded(d, [90, y0, W - 90, y0 + th], 24, (255, 255, 255, 255))
    y = y0 + 26
    for ln in lines:
        tw = textlen_rich(d, ln, fnt)
        draw_rich(img, d, ((W - tw) / 2, y), ln, fnt, (0, 0, 0, 255))
        y += lh
    return img

def render_hook(spec):
    """Hook opener PNG (1.5s)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 158))
    d = ImageDraw.Draw(img)
    fnt = font(110)
    lines = wrap(d, spec.get("hook", ""), fnt, W - 120)
    lh = int(110 * 1.2)
    th = len(lines) * lh
    y = (H - th) / 2
    for ln in lines:
        tw = textlen_rich(d, ln, fnt)
        draw_rich(img, d, ((W - tw) / 2, y), ln, fnt, (255, 255, 255, 255))
        y += lh
    return img

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    spec = json.load(open(a.script))
    dur = float(spec.get("duration", 18.0))
    tmp = "/tmp/fast_render"
    os.makedirs(tmp, exist_ok=True)
    overlay = os.path.join(tmp, "overlay.png")
    hookpng = os.path.join(tmp, "hook.png")
    render_overlay(spec).save(overlay)
    render_hook(spec).save(hookpng)

    bg = spec["background"]
    audio = spec["audio"]
    # Ken Burns: slow zoom + diagonal drift via zoompan, then overlays.
    nframes = int(dur * 30)
    fc = (
        f"[0:v]fps=30,zoompan=z='1.06+0.10*on/{nframes}':"
        f"x='iw/2-(iw/zoom/2)-36*on/{nframes}':"
        f"y='ih/2-(ih/zoom/2)+24*on/{nframes}':"
        f"d=1:s=1080x1920:fps=30[bg];"
        f"[bg][1:v]overlay=0:0:enable='gte(t,1.5)'[ov];"
        f"[ov][2:v]overlay=0:0:enable='between(t,0,1.5)'[v]"
    )
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-stream_loop", "2", "-i", bg,
           "-i", overlay, "-i", hookpng,
           "-i", audio,
           "-filter_complex", fc,
           "-map", "[v]", "-map", "3:a",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
           "-c:a", "aac", "-b:a", "160k",
           "-t", str(dur), "-shortest", a.out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:]); raise SystemExit(1)
    print("OK", a.out)

if __name__ == "__main__":
    main()
