import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ARABIC_THEME as T } from "./arabicTheme";

export type KineticColor = "gold" | "white" | "amber" | "red";

interface KineticLineProps {
  /** The line's text (Arabic, RTL). */
  text: string;
  /** Font size in px. */
  size: number;
  color?: KineticColor;
  /** Delay before the first word pops (seconds). */
  delaySec?: number;
  /** Vertical center position (px from top of 1920 canvas). */
  y?: number;
  /** Max width in px; text wraps centered. */
  maxWidth?: number;
  /** Extra letter spacing (px). */
  letterSpacing?: number;
  /** Horizontal center (px). Default 540. */
  x?: number;
}

/**
 * One kinetic typography line: words pop in one by one with a springy
 * scale + blur + rise, right-to-left. Gold lines get a metallic gradient
 * fill; white lines get a warm glow.
 */
export const KineticLine: React.FC<KineticLineProps> = ({
  text,
  size,
  color = "white",
  delaySec = 0,
  y = 960,
  maxWidth = 940,
  letterSpacing = 0,
  x = 540,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text) return null;

  const words = text.split(/\s+/).filter(Boolean);

  const colorStyle: React.CSSProperties =
    color === "gold"
      ? {
          background: T.goldGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "none",
          filter: "drop-shadow(0 4px 0 rgba(120,40,0,0.85)) drop-shadow(0 0 22px rgba(255,170,40,0.5))",
        }
      : color === "amber"
        ? {
            color: T.amber,
            textShadow: `0 0 16px rgba(255,158,44,0.8), 0 4px 0 rgba(90,30,0,0.9)`,
          }
        : color === "red"
          ? {
              color: T.redAccent,
              textShadow: `0 0 18px rgba(229,57,43,0.9), 0 4px 0 rgba(60,5,0,0.9)`,
            }
          : {
              color: T.white,
              textShadow: T.whiteGlow,
            };

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x - maxWidth / 2,
        width: maxWidth,
        transform: "translateY(-50%)",
        direction: "rtl",
        unicodeBidi: "plaintext",
        textAlign: "center",
        fontFamily: T.fontFamily,
        fontWeight: T.fontWeight,
        fontSize: size,
        lineHeight: 1.35,
        letterSpacing,
        pointerEvents: "none",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delaySec + i * 0.09;
        const p = spring({
          frame: frame - wordDelay * fps,
          fps,
          config: { mass: 0.9, damping: 11, stiffness: 240 },
        });
        const scale = interpolate(p, [0, 1], [0.2, 1]);
        const blur = interpolate(p, [0, 1], [14, 0]);
        const rise = interpolate(p, [0, 1], [46, 0]);
        const opacity = interpolate(p, [0, 0.35], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // A little extra punch on the active (last-popped) word
        const punch = interpolate(p, [0.55, 1], [1.16, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `scale(${scale * punch}) translateY(${rise}px)`,
              filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
              ...colorStyle,
              marginLeft: "0.22em",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
