/**
 * News style theme — ported from kinetic-reel-engine's "news-viral" preset.
 *
 * Bilel's signature news-reel look:
 * - Karaoke captions: Anton, white, active word highlighted yellow
 * - Hook: bold highlight bar — black text on yellow
 * - Animated badge: yellow/black highlight, pops when the number is spoken
 * - Teaser 0–3s: strongest moment first, flash-white transition
 * - End-screen CTA: fade to black + highlight question
 */
export const NEWS_THEME = {
  captionColor: "#FFFFFF",
  activeWordColor: "#FFD60A",
  activeWordGlow:
    "0 0 28px rgba(255,214,10,0.85), 0 2px 0 rgba(0,0,0,0.9)",
  captionShadow: "0 3px 0 rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.6)",
  hookBg: "#FFD60A",
  hookColor: "#0A0A0A",
  badgeBg: "#FFD60A",
  badgeColor: "#0A0A0A",
  ctaBg: "#FFD60A",
  ctaColor: "#0A0A0A",
  fontFamily: "'Anton', sans-serif",
} as const;

export const NEWS_DEFAULTS = {
  // CTA text per language — parameterizable via --cta / seg fields
  ctaText: {
    fr: "VOUS EN PENSEZ QUOI ?",
    de: "WAS DENKT IHR?",
  } as Record<string, string>,
} as const;
