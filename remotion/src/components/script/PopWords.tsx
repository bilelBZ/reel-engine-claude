import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * PopWords — per-word spring pop-in for kinetic text cards.
 * Words matching `highlightWords` (case-insensitive, punctuation-ignored)
 * render in the accent color.
 */
export const PopWords: React.FC<{
  text: string;
  highlightWords?: string[];
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  lineHeight?: number;
  maxWidth?: number;
  /** frames between each word's pop */
  stagger?: number;
  /** global frame offset where this text's timeline starts */
  frameOffset?: number;
}> = ({
  text,
  highlightWords = [],
  fontSize = 64,
  color = "#FFFFFF",
  highlightColor = "#FFD60A",
  fontFamily = "Montserrat, sans-serif",
  fontWeight = 700,
  lineHeight = 1.25,
  maxWidth = 900,
  stagger = 2,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hl = new Set(highlightWords.map(norm));

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        maxWidth,
        lineHeight,
        textAlign: "center",
      }}
    >
      {words.map((w, i) => {
        const local = frame - frameOffset - i * stagger;
        const p = spring({
          frame: Math.max(0, local),
          fps,
          config: { damping: 13, stiffness: 220 },
        });
        const isHl = hl.has(norm(w));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.26em",
              fontSize,
              fontFamily,
              fontWeight,
              color: isHl ? highlightColor : color,
              opacity: p,
              transform: `scale(${(0.55 + 0.45 * p).toFixed(3)}) translateY(${((1 - p) * 26).toFixed(1)}px)`,
              filter: `blur(${((1 - p) * 10).toFixed(1)}px)`,
              textShadow: isHl
                ? "0 0 26px rgba(255,214,10,0.55)"
                : "0 3px 0 rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.55)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
