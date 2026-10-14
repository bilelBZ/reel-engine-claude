# Backup — feat/dollarmindlab-style

Say It Save It MoneyCards: DollarMindLab style (top transformation bar, numbered black boxes, YES/NO CTA), JSON-driven, Ken Burns backgrounds.

- Branch HEAD: `9ddf1f442be45e85d0a1627ef900a4de5d27f7ad` | Upstream base: `AgriciDaniel/claude-shorts@a369fad9` | backed up 2026-10-14

## Restore

```bash
git clone https://github.com/AgriciDaniel/claude-shorts claude-shorts
cd claude-shorts
git checkout a369fad9
# then overlay the files from this branch snapshot (paths as in repo)
```

## Skipped files (not pushed)

- `remotion/public/fonts/NotoSansDisplay-Black.ttf (binary/model — see restore notes)`

- `haarcascade_frontalface_default.xml`: https://github.com/opencv/opencv/raw/master/data/haarcascades/haarcascade_frontalface_default.xml
- Fonts (Anton/Bangers/Inter/Montserrat/Cairo/Noto): Google Fonts.
