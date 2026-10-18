import { useCurrentFrame } from "remotion";
import { FARES } from "./faresTheme";

/** Deterministic PRNG — stable renders frame to frame. */
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
 * Fares atmosphere: obsidian base, slow-breathing crimson radial glow,
 * faint blueprint grid, dark vignette. Never static — always alive.
 */
export const FaresBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FARES.fps;
  const breathe = 0.75 + 0.25 * Math.sin(t * Math.PI * 0.4);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: FARES.bgDark,
        overflow: "hidden",
      }}
    >
      {/* crimson aura wash */}
      <div
        style={{
          position: "absolute",
          inset: -240,
          opacity: breathe,
          background: `radial-gradient(ellipse 58% 42% at 50% 30%, rgba(255,46,54,0.16) 0%, rgba(255,46,54,0.05) 45%, transparent 75%)`,
        }}
      />
      {/* faint grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${FARES.gridColor} 2px, transparent 2px), linear-gradient(90deg, ${FARES.gridColor} 2px, transparent 2px)`,
          backgroundSize: "96px 96px",
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, #000 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, #000 30%, transparent 85%)",
        }}
      />
      {/* drifting ember dust */}
      <Embers />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 65% at 50% 50%, transparent 42%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </div>
  );
};

/** Tiny ember particles drifting upward — the fares "alive" layer. */
const Embers: React.FC<{ count?: number; seed?: number }> = ({
  count = 26,
  seed = 9,
}) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(seed);
  const parts = Array.from({ length: count }, (_, i) => {
    const x = 40 + rand() * 1000;
    const y0 = 80 + rand() * 1760;
    const size = 3 + rand() * 9;
    const speed = 14 + rand() * 30;
    const phase = rand() * Math.PI * 2;
    const red = rand() < 0.55;
    const y =
      ((((y0 - (frame / 30) * speed - 80) % 1760) + 1760) % 1760) + 80;
    const tw =
      0.25 + 0.75 * Math.abs(Math.sin((frame / 30) * (1 + rand() * 2) + phase));
    return { x, y, size, tw, red, key: i };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {parts.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            opacity: p.tw * 0.8,
            background: p.red ? "#FF2E36" : "#FFD9A0",
            boxShadow: p.red
              ? "0 0 10px rgba(255,46,54,0.9)"
              : "0 0 8px rgba(255,217,160,0.8)",
          }}
        />
      ))}
    </div>
  );
};
