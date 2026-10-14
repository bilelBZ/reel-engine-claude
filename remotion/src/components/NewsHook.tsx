import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { NEWS_THEME } from "../styles/newsTheme";

interface NewsHookProps {
  text: string;
  /** Seconds to shift the hook window (embedded cover at video start). */
  offsetSec?: number;
}

/**
 * News highlight hook bar: bold black-on-yellow bar, slides in from the
 * left at 0.15s (+offsetSec), exits (fade up) at 3.0–3.4s (+offsetSec).
 *
 * Ported from kinetic-reel-engine "news-viral": hook showAt 0.15, hideAt 3.4.
 */
export const NewsHook: React.FC<NewsHookProps> = ({ text, offsetSec = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  const showAt = 0.15 + offsetSec;
  const hideAt = 3.4 + offsetSec;
  if (currentTimeSec < showAt || currentTimeSec > hideAt || !text) return null;

  const enterFrame = showAt * fps;

  // Slide in from the left (power4.out over 0.45s)
  const x = interpolate(
    frame,
    [enterFrame, enterFrame + 0.45 * fps],
    [-900, 0],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Fade out + rise between 3.0s and 3.4s (shifted by offsetSec)
  const outProgress = interpolate(
    currentTimeSec,
    [3.0 + offsetSec, 3.4 + offsetSec],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const opacity = 1 - outProgress;
  const y = -30 * outProgress;

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translate(${x}px, ${y}px)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: NEWS_THEME.fontFamily,
          fontWeight: 400,
          fontSize: 72,
          backgroundColor: NEWS_THEME.hookBg,
          color: NEWS_THEME.hookColor,
          padding: "18px 34px",
          whiteSpace: "nowrap",
          lineHeight: 1.15,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {text.toUpperCase()}
      </div>
    </div>
  );
};
