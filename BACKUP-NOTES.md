# Backup — feat/arabic-kinetic

Arabic kinetic typography (red/black/gold, RTL, Cairo Black), JSON-driven parameterized scenes.

- Branch HEAD: `cb6c2fd84a9c1f523e8f29d4c64b508dd999de11` | Upstream base: `AgriciDaniel/claude-shorts@a369fad9` | backed up 2026-10-14

## Restore

```bash
git clone https://github.com/AgriciDaniel/claude-shorts claude-shorts
cd claude-shorts
git checkout a369fad9
# then overlay the files from this branch snapshot (paths as in repo)
```

## Skipped files (not pushed)

- `remotion/public/fonts/Anton-Regular.woff2 (binary/model — see restore notes)`
- `remotion/public/fonts/Cairo-Black-arabic.woff2 (binary/model — see restore notes)`
- `remotion/public/fonts/Cairo-Black-latin-ext.woff2 (binary/model — see restore notes)`
- `remotion/public/fonts/Cairo-Black-latin.woff2 (binary/model — see restore notes)`

- `haarcascade_frontalface_default.xml`: https://github.com/opencv/opencv/raw/master/data/haarcascades/haarcascade_frontalface_default.xml
- Fonts (Anton/Bangers/Inter/Montserrat/Cairo/Noto): Google Fonts.
