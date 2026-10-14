import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ARABIC_THEME as T } from "./arabicTheme";

/** Deterministic PRNG so renders are stable frame to frame. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The signature backdrop: near-black base + deep-red radial glow that
 * breathes slowly + dark vignette at the edges.
 */
export const BackgroundGlow: React.FC<{ seed?: number }> = ({ seed = 7 }) => {
  const frame = useCurrentFrame();
  const breathe = 0.82 + 0.18 * Math.sin((frame / 30) * Math.PI * 0.5 + seed);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: T.bgBase,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: `radial-gradient(ellipse 62% 46% at 50% 44%, rgba(190,32,18,${0.5 * breathe}) 0%, rgba(120,12,8,${0.42 * breathe}) 42%, rgba(40,4,4,0.25) 68%, transparent 82%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 120% 105% at 50% 50%, transparent 55%, ${T.vignette} 100%)`,
        }}
      />
    </div>
  );
};

interface SparklesProps {
  /** How many sparkle particles. */
  count?: number;
  seed?: number;
  /** Region to scatter in. Defaults to full canvas. */
  area?: { x: number; y: number; w: number; h: number };
  goldRatio?: number;
}

/**
 * Twinkling 4-point star / diamond sparkles drifting slowly upward,
 * like the reference's ember particles.
 */
export const Sparkles: React.FC<SparklesProps> = ({
  count = 30,
  seed = 42,
  area = { x: 40, y: 120, w: 1000, h: 1680 },
  goldRatio = 0.6,
}) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(seed);
  const parts = Array.from({ length: count }, (_, i) => {
    const x = area.x + rand() * area.w;
    const y0 = area.y + rand() * area.h;
    const size = 8 + rand() * 22;
    const speed = 6 + rand() * 18; // px per second upward
    const phase = rand() * Math.PI * 2;
    const gold = rand() < goldRatio;
    const star = rand() < 0.35; // 4-point star vs diamond
    const y = ((y0 - (frame / 30) * speed - area.y) % area.h + area.h) % area.h + area.y;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin((frame / 30) * (1.2 + rand() * 1.6) + phase));
    return { x, y, size, tw, gold, star, key: i };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {parts.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            opacity: p.tw,
            transform: `rotate(45deg) scale(${0.7 + 0.5 * p.tw})`,
            background: p.gold
              ? "linear-gradient(135deg, #FFE9A8, #FF9E2C)"
              : "linear-gradient(135deg, #FFFFFF, #FFD9A0)",
            clipPath: p.star
              ? "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)"
              : "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            boxShadow: p.gold
              ? "0 0 12px rgba(255,180,60,0.9)"
              : "0 0 10px rgba(255,255,255,0.8)",
          }}
        />
      ))}
    </div>
  );
};

interface SpeedLinesProps {
  /** Vertical band the lines live in. */
  y?: number;
  bandH?: number;
  count?: number;
  seed?: number;
  color?: string;
}

/**
 * Horizontal light streaks sweeping across the screen — the reference's
 * "speed lines" that sell the kinetic energy.
 */
export const SpeedLines: React.FC<SpeedLinesProps> = ({
  y = 960,
  bandH = 700,
  count = 7,
  seed = 11,
  color = "255,120,60",
}) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(seed);
  const lines = Array.from({ length: count }, (_, i) => {
    const ly = y - bandH / 2 + rand() * bandH;
    const w = 140 + rand() * 320;
    const h = 3 + rand() * 5;
    const speed = 900 + rand() * 1400; // px per second
    const span = 1080 + w * 2;
    const x = 1080 + w - (((frame / 30) * speed + rand() * span) % span);
    const opacity = 0.25 + 0.55 * rand();
    return { ly, w, h, x, opacity, key: i };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {lines.map((l) => (
        <div
          key={l.key}
          style={{
            position: "absolute",
            top: l.ly,
            left: l.x,
            width: l.w,
            height: l.h,
            borderRadius: l.h / 2,
            background: `linear-gradient(90deg, transparent 0%, rgba(${color},0.1) 25%, rgba(${color},${l.opacity}) 55%, rgba(255,220,160,${Math.min(1, l.opacity + 0.25)}) 100%)`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
};

/** Simple fade+scale wrapper used for scene enter/exit transitions. */
export const SceneTransition: React.FC<{
  localT: number;
  duration: number;
  children: React.ReactNode;
}> = ({ localT, duration, children }) => {
  const fadeIn = interpolate(localT, [0, 0.28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(localT, [duration - 0.22, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(localT, [0, 0.5], [1.045, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: Math.min(fadeIn, fadeOut),
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};
