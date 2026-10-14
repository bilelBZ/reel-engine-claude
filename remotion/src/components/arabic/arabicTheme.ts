/**
 * Arabic-Kinetic style theme — pure motion graphics, no footage.
 *
 * Palette lifted from the reference reel: near-black background with a
 * deep-red radial glow, gold/amber kinetic typography, white glow text,
 * red accents. Everything is drawn with CSS/SVG in Remotion.
 */
export const ARABIC_THEME = {
  /** Canvas */
  width: 1080,
  height: 1920,
  fps: 30,

  /** Background */
  bgBase: "#0B0506",
  glowRed: "rgba(190, 32, 18, 0.55)",
  glowDeep: "rgba(120, 12, 8, 0.75)",
  vignette: "rgba(0, 0, 0, 0.85)",

  /** Typography */
  fontFamily: "'Cairo Black', 'Cairo', sans-serif",
  fontWeight: 900,
  goldGradient:
    "linear-gradient(180deg, #FFF3C4 0%, #FFD766 28%, #FFB52E 55%, #FF8A1E 80%, #E56A00 100%)",
  goldSolid: "#FFC93C",
  amber: "#FF9E2C",
  white: "#FFFFFF",
  whiteGlow: "0 0 18px rgba(255,255,255,0.85), 0 0 60px rgba(255,170,60,0.55)",
  goldGlow:
    "0 4px 0 rgba(120,40,0,0.9), 0 0 26px rgba(255,170,40,0.65), 0 10px 40px rgba(0,0,0,0.6)",
  redAccent: "#E5392B",
  deepRed: "#8E0F0F",

  /** Cards / tiles */
  tileBg: "#14161C",
  tileBorder: "#2A2E38",
  tileGlow: "0 0 24px rgba(229, 57, 43, 0.45)",

  /** Editor mock */
  editorBg: "#101014",
  editorBar: "#1B1D24",
} as const;
