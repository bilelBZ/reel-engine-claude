import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { useCaptionPages } from "../hooks/useCaptionPages";
import { NEWS_THEME } from "../styles/newsTheme";
import type { Caption } from "../types";

interface NewsCaptionsProps {
  captions: Caption[];
}

/**
 * News-style karaoke captions: Anton, white text, ACTIVE word highlighted
 * yellow in real time. Each word pops in (blur 12px -> 0, scale 1.35 -> 1)
 * at its own timestamp, then lights up yellow while spoken.
 *
 * Font: Anton (latin)
 * Words per page: 2-3 (800ms combine window)
 * Position: bottom 350px (above platform UI chrome)
 */
export const NewsCaptions: React.FC<NewsCaptionsProps> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const pages = useCaptionPages(captions, 800);

  const currentPage = pages.find(
    (p) => currentTimeMs >= p.startMs && currentTimeMs < p.startMs + p.durationMs
  );

  if (!currentPage) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 350,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      {currentPage.tokens.map((token, i) => {
        const isActive =
          currentTimeMs >= token.fromMs && currentTimeMs < token.toMs;

        // Per-word entrance pop at the word's own timestamp
        const wordStartFrame = Math.floor((token.fromMs / 1000) * fps);
        const progress = spring({
          frame: Math.max(0, frame - wordStartFrame),
          fps,
          config: { mass: 1, damping: 14, stiffness: 260 },
        });
        const scale = interpolate(progress, [0, 1], [1.35, isActive ? 1.18 : 1]);
        const blur = interpolate(progress, [0, 1], [12, 0]);
        const opacity = interpolate(progress, [0, 0.4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={`${currentPage.startMs}-${i}`}
            style={{
              fontFamily: NEWS_THEME.fontFamily,
              fontWeight: 400,
              fontSize: 80,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              color: isActive
                ? NEWS_THEME.activeWordColor
                : NEWS_THEME.captionColor,
              textShadow: isActive
                ? NEWS_THEME.activeWordGlow
                : NEWS_THEME.captionShadow,
              lineHeight: 1.15,
              textAlign: "center",
              opacity,
              transform: `scale(${scale})`,
              filter: `blur(${blur}px)`,
            }}
          >
            {token.text.trim().toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};
