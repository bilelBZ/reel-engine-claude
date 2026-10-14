import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { NEWS_THEME } from "../styles/newsTheme";

interface NewsCTAProps {
  text: string;
  /** Time (seconds) when the end-screen CTA appears — typically duration - 2.4s. */
  showAtSec: number;
}

/**
 * End-screen CTA: video fades to black, then the highlight question
 * pops in ("VOUS EN PENSEZ QUOI ?", "WAS DENKT IHR?", ...).
 *
 * Ported from kinetic-reel-engine "news-viral": cta showAt = duration - 2.4s.
 */
export const NewsCTA: React.FC<NewsCTAProps> = ({ text, showAtSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  if (!text || currentTimeSec < showAtSec) return null;

  const showFrame = showAtSec * fps;

  // Black overlay fades to 0.92 over 0.6s
  const bgOpacity = interpolate(
    frame,
    [showFrame, showFrame + 0.6 * fps],
    [0, 0.92],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Text rises in 0.15s after the overlay starts
  const textFrame = showFrame + 0.15 * fps;
  const textProgress = interpolate(
    frame,
    [textFrame, textFrame + 0.5 * fps],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "black",
          opacity: bgOpacity,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: "50%",
          display: "flex",
          justifyContent: "center",
          opacity: textProgress,
          transform: `translateY(${(1 - textProgress) * 40}px) scale(${
            0.9 + 0.1 * textProgress
          })`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: NEWS_THEME.fontFamily,
            fontWeight: 400,
            fontSize: 84,
            backgroundColor: NEWS_THEME.ctaBg,
            color: NEWS_THEME.ctaColor,
            padding: "22px 40px",
            textAlign: "center",
            lineHeight: 1.15,
            boxShadow: "0 14px 60px rgba(0,0,0,0.6)",
          }}
        >
          {text.toUpperCase()}
        </div>
      </div>
    </>
  );
};
