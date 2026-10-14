# Caption Styles — Visual Specifications

Four premium caption presets for different content tones. Each uses `@remotion/captions` createTikTokStyleCaptions() for word-level timing.

## Bold Style

Best for: Business, education, motivation, "guru" content.

| Property | Value |
|----------|-------|
| Font | Montserrat Bold (800 weight) |
| Font Size | 72px |
| Text Transform | UPPERCASE |
| Words Per Page | 2-3 |
| Combine Window | 800ms |
| Text Color | White (#FFFFFF) |
| Active Word | Yellow (#FFD700) |
| Text Shadow | 3px solid black outline (all 4 directions) |
| Position | Bottom: 350px from bottom edge |
| Animation | Pop-in spring: {mass:1, damping:12, stiffness:200} |
| Timing | Page appears at first word, disappears after last word |

**Visual reference**: All caps, word-by-word yellow highlight, bold pop-in entrance.

**Spring config explained**:
- `damping: 12` — moderate bounce, settles in ~0.4s
- `stiffness: 200` — snappy entrance
- Scale goes from 0 → slight overshoot (~1.05) → 1.0

## Bounce Style

Best for: Entertainment, reactions, challenges, high-energy content.

| Property | Value |
|----------|-------|
| Font | Bangers (Google Fonts, OFL) |
| Font Size | 84px |
| Text Transform | UPPERCASE |
| Words Per Page | 1-2 |
| Combine Window | 600ms |
| Text Color | Rotating (see below) |
| Text Shadow | 4px solid black outline (all 4 directions) |
| Position | Bottom: 350px from bottom edge |
| Animation | Bouncy scale: 70% → ~120% → 100% |
| Spring Config | {mass:1, damping:8, stiffness:180} |

**Color rotation** (per page, cycling):
1. Cyan (#00FFFF)
2. Magenta (#FF00FF)
3. Lime (#00FF00)
4. Yellow (#FFFF00)
5. Orange (#FF6600)
6. Hot Pink (#FF0066)

**Spring config explained**:
- `damping: 8` — very bouncy, overshoots significantly
- Scale: starts at 0.7, springs up to ~1.2, settles at 1.0
- Creates the "explosive word pop" effect

## Clean Style

Best for: Professional, interviews, calm content, podcasts.

| Property | Value |
|----------|-------|
| Font | Inter Bold (700 weight) |
| Font Size | 56px |
| Text Transform | None (preserves original case) |
| Words Per Page | 3-5 |
| Combine Window | 1500ms |
| Text Color | White (#FFFFFF) |
| Active Word | Light gray (#E0E0E0) |
| Text Shadow | 2px 2px 8px rgba(0,0,0,0.6) — soft shadow |
| Position | Bottom: 350px from bottom edge |
| Animation | Fade-in opacity 0→1 over 6 frames (200ms at 30fps) |

**Visual reference**: Minimal, readable, doesn't distract from the speaker. Subtle active-word highlighting through slight color change rather than bold contrast.

## News Style

Best for: News/politics/economy reels, factual extract content (Bilel's locked FR/DE standard).

This is the signature "news-viral" look: karaoke captions over real footage,
a bold highlight hook bar, an animated number badge, a 0–3s teaser with
flash transition, and an end-screen CTA.

| Property | Value |
|----------|-------|
| Font | Anton (latin subset, woff2) |
| Font Size | 80px |
| Text Transform | UPPERCASE |
| Words Per Page | 2-3 |
| Combine Window | 800ms |
| Text Color | White (#FFFFFF) |
| Active Word | Yellow (#FFD60A) + gold glow |
| Text Shadow | 3px hard black + soft black halo |
| Position | Bottom: 350px from bottom edge |
| Animation | Per-word pop: blur(12px)→0, scale 1.35→1, spring {mass:1, damping:14, stiffness:260}; active word scales to 1.18 |

**Hook bar**: black text on yellow (#FFD60A) highlight bar, Anton 72px,
slides in from the left at 0.15s, fades out 3.0–3.4s. Uses `hook_line1` from
the segment JSON.

**Badge**: yellow/black highlight, Anton 110px, pops (scale 0.2→1, slight
rotation settle) at `badge_at` seconds (the moment the number is spoken),
stays 1.6s, pops out. Set via `badge_text` / `badge_at` in the segment JSON.

**Teaser flash**: white flash at `teaser_end` seconds (teaser 0–3s, strongest
moment first), dissolves in 0.14s.

**End-screen CTA**: fade to black, then the highlight question rises in —
default "VOUS EN PENSEZ QUOI ?" (FR) or "WAS DENKT IHR?" (DE), shown from
duration − 2.4s. Overridable with `--cta "CUSTOM"`.

**Integration with Hook Overlay**: the news style replaces the generic
HookOverlay with the highlight bar; captions stay in the bottom zone.
Progress bar remains visible.

## Arabic-Kinetic Style

Best for: Arabic motion-graphics reels — pure animation, no footage
(Bilel's reference: Egyptian-dialect kinetic typography, red/black/gold).

Unlike the caption styles above, `arabic-kinetic` is a **separate Remotion
composition** (`ArabicKinetic`, 1080x1920, 30fps) driven entirely by a JSON
**script**: an ordered list of timed scenes. Every visible text line is a
parameter, so the copy can be swapped without touching code.

| Property | Value |
|----------|-------|
| Font | Cairo Black, weight 900 (arabic + latin + latin-ext woff2 subsets) |
| Text Direction | RTL (`direction: rtl`, `unicode-bidi: plaintext`) |
| Palette | Near-black `#0B0506`, deep-red radial glow, gold gradient `#FFF3C4→#E56A00`, white glow text, red `#E5392B` accents |
| Animation | Per-word pop: blur(14px)→0, scale 0.2→1, rise 46px→0, spring {mass:0.9, damping:11, stiffness:240}, staggered 90ms/word, RTL order |
| Atmosphere | Breathing red radial glow, twinkling diamond/star sparkles, horizontal speed lines |
| Transitions | 0.28s fade-in + scale 1.045→1 on scene enter, 0.22s fade on exit |

**Render**: `node remotion/render-arabic.mjs --script script.json [--audio voiceover.mp3] [--output-dir DIR] [--out short_01.mp4]`
A local audio file is served over a tiny HTTP server so the MP4 gets an
audio track. Output is 1080x1920 H264, `short_*.mp4` naming fits `scripts/validate.sh`.

### Script JSON schema

```json
{
  "duration": 20.5,
  "audio": "optional/path/or/url.mp3",
  "scenes": [
    { "type": "starburst", "start": 0, "end": 1.4, "lines": ["إيه ده؟!"] }
  ]
}
```

Top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Total video length in seconds (drives composition length) |
| `audio` | string | Optional voiceover/music file or URL (muxed as the audio track) |
| `scenes` | array | Ordered scene list; must cover 0 → duration with no gaps |

Scene fields (all scenes):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | enum | — | `starburst` \| `ai-orbit` \| `editor` \| `eye` \| `title-cards` \| `card-grid` \| `robot-bar` \| `question` \| `cta` |
| `start` / `end` | number | — | Scene time range in seconds (video-local) |
| `lines` | string[] | `[]` | Kinetic text lines, top → bottom (meaning per type, below) |
| `word` | string | `""` | Giant latin display word (`ai-orbit`, `cta`, e.g. `"AI"`); the diamond symbol in `question` (default `"؟"`) |
| `icons` | string[] | `[]` | Icon tiles: `image` \| `text` \| `audio` \| `play` \| `spark` (`ai-orbit`, `robot-bar`) |
| `cards` | string[] | `[]` | Art cards: `sunset` \| `city` \| `waveform` \| `equalizer` (`title-cards`, `card-grid`, `editor`) |
| `arrow` | boolean | false | Gold arrow next to the cards (`title-cards`) |
| `robot` | boolean | false | Cute robot head on top (`ai-orbit`) |
| `bigWord` | string | `""` | Big gold word under the grid (`card-grid`) |
| `comment` | string | `""` | Typed text in the comment box; empty = placeholder (`cta`) |
| `commentPlaceholder` | string | `"أضف تعليقا..."` | Placeholder in the comment box (`cta`) |

Scene-type line mapping:

| Type | Visual | `lines` meaning |
|------|--------|-----------------|
| `starburst` | Jagged red burst + glowing white hook text + sparkles | `[hook]` (+ optional gold sub-line) |
| `ai-orbit` | Robot head, giant word w/ orbiting golden ring + comet, 5 floating icon tiles | `[top line, bottom gold line]` |
| `editor` | Top line + video-editor window (preview + timeline tracks + playhead) | `[top gold line, bottom line]` |
| `eye` | Top line + animated eye (rotating dashed rings) + speed lines | `[top gold line, bottom line]` |
| `title-cards` | Big gold title + small line + art cards + gold arrow | `[big title, small line]` |
| `card-grid` | Top line + 2×2 art card grid + big gold word + sparkles | `[top line]` + `bigWord` |
| `robot-bar` | Top line + robot head + 5 icon tiles + orange progress bar | `[top line, bottom gold line]` |
| `question` | Top line + mid gold line + diamond-pixel "؟" + bottom gold line | `[top, mid, bottom]` + `word` = symbol |
| `cta` | "اكتب"-style line + giant word w/ orbit + gold line + comment box + 2 final lines | `[l1, l2, l3, l4]` + `word` + `comment` |

A ready-to-render sample using the reference reel's own lines lives at
`remotion/examples/arabic-kinetic-sample.json` (11 scenes, 20.5s).

## Font Files

All fonts must be placed in `remotion/public/fonts/`:
- `Montserrat-Bold.ttf` — from Google Fonts (OFL license)
- `Bangers-Regular.ttf` — from Google Fonts (OFL license)
- `Inter-Bold.ttf` — from Google Fonts (OFL license)
- `Anton-Regular.woff2` — from Google Fonts (OFL license, latin subset)
- `Cairo-Black-arabic.woff2`, `Cairo-Black-latin.woff2`, `Cairo-Black-latin-ext.woff2` — from Google Fonts (OFL license, weight 900 subsets; registered with unicode-range in `remotion/src/styles/fonts.ts`)

Download from: https://fonts.google.com/

## Caption Positioning

All styles share the same vertical positioning:
- **Bottom offset**: 350px from bottom edge of 1920px frame
- This places captions above the platform's built-in UI elements (like/comment/share buttons)
- Safe zone for TikTok: 150px from bottom, 64px from sides
- Safe zone for YouTube Shorts: 120px from bottom
- Our 350px offset clears all platform UI with margin

## Integration with Hook Overlay

The hook overlay occupies the top 200px zone (first 3.5s only). Captions appear in the bottom zone. No overlap.

When both are visible (0.3s - 3.5s), the visual hierarchy is:
1. Hook text (top, large, attention-grabbing)
2. Video content (center)
3. Captions (bottom, word-level)
4. Progress bar (very bottom, subtle)
