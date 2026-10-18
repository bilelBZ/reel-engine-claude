/**
 * Fares Editorial theme — ported from kinetic-reel-engine's
 * fares-editorial.mjs (@nv3us signature style).
 *
 * Deep obsidian luxury black, isolated floating hero graphics with
 * electric crimson aura, giant Cairo Black 900 Arabic typography,
 * word-by-word blur reveals, electric-red keyword slams with
 * screen shake, cinematic slow push-in per scene.
 */
import { staticFile } from "remotion";

export const FARES = {
  width: 1080,
  height: 1920,
  fps: 30,

  // Palette
  bgDark: "#070707",
  bgLight: "#121214",
  textColor: "#FFFFFF",
  keywordColor: "#FF2E36",
  keywordGlow:
    "0 0 35px rgba(255,46,54,0.9), 0 0 85px rgba(255,46,54,0.5)",
  wordGlow: "0 0 24px rgba(255,255,255,0.22)",
  heroAura:
    "radial-gradient(circle, rgba(255,46,54,0.55) 0%, rgba(245,158,11,0.20) 45%, transparent 75%)",
  heroShadow: "0 35px 70px rgba(0,0,0,0.85)",
  gridColor: "rgba(255,255,255,0.035)",
  tagBg: "rgba(255,46,54,0.15)",
  tagColor: "#FF2E36",

  // Layout (fractions of canvas where handy)
  heroTop: 0.29, // hero panel vertical center
  heroW: 840,
  heroH: 560,
  captionTop: 0.56,
  captionPadding: 60,
  wordFontSize: 92, // RTL
  keywordFontSize: 140,

  // Timing
  wordStagger: 0.16, // seconds between word reveals
  wordRevealDur: 0.16,
  keywordSlamDur: 0.24,
} as const;

/** Cairo Black @font-face CSS (same subsets as arabic-kinetic). */
const CAIRO_SUBSETS = [
  {
    file: "fonts/Cairo-Black-arabic.woff2",
    range:
      "U+0600-06FF, U+0750-077F, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC",
  },
  {
    file: "fonts/Cairo-Black-latin-ext.woff2",
    range: "U+0100-02BA, U+1E00-1E9F",
  },
  {
    file: "fonts/Cairo-Black-latin.woff2",
    range: "U+0000-00FF, U+2000-206F",
  },
] as const;

export const faresFontFaceCSS = CAIRO_SUBSETS.map(
  (s) => `
@font-face {
  font-family: 'Cairo Black';
  src: url('${staticFile(s.file)}') format('woff2');
  font-weight: 900;
  font-display: block;
  unicode-range: ${s.range};
}
`
).join("\n");

export const FARES_FONT = "'Cairo Black', 'Cairo', sans-serif";
