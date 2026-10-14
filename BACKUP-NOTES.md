# Backup — feat/news-style

FR/DE news reels: YouTube extracts, Anton karaoke (yellow active word), teaser+hook single render, badge, CTA, face-tracked speaker centering, embedded 1.2s cover card.

- Branch HEAD: `a20ea5c3f1e9adb447281a05e8b4270df25da3f4` | Upstream base: `AgriciDaniel/claude-shorts@a369fad9` | backed up 2026-10-14

## Restore

```bash
git clone https://github.com/AgriciDaniel/claude-shorts claude-shorts
cd claude-shorts
git checkout a369fad9
# then overlay the files from this branch snapshot (paths as in repo)
```

## Skipped files (not pushed)

- `remotion/public/fonts/Anton-Regular.woff2 (binary/model — see restore notes)`
- `scripts/models/blaze_face_short_range.tflite (binary/model — see restore notes)`
- `scripts/models/haarcascade_frontalface_default.xml (binary/model — see restore notes)`

- `haarcascade_frontalface_default.xml`: https://github.com/opencv/opencv/raw/master/data/haarcascades/haarcascade_frontalface_default.xml
- Fonts (Anton/Bangers/Inter/Montserrat/Cairo/Noto): Google Fonts.
