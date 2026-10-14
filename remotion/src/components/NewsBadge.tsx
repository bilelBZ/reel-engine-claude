import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { NEWS_THEME } from "../styles/newsTheme";

interface NewsBadgeProps {
  text: string;
  /** Time (seconds, clip-local) when the badge pops — typically when the number is spoken. */
  atSec: number;
  /** Seconds the badge stays visible before popping out. */
  visibleSec?: number;
}

/**
 * Animated number badge: yellow/black highlight that pops exactly when the
 * number is spoken, stays ~1.6s, then pops out.
 *
 * Ported from kinetic-reel-engine "news-viral" badge animation.
 */
export const NewsBadge: React.FC<NewsBadgeProps> = ({
  text,
  atSec,
  visibleSec = 1.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  if (!text || currentTimeSec < atSec || currentTimeSec > atSec + visibleSec) {
    return null;
  }

  const atFrame = atSec * fps;

  // Pop-in: scale 0.2 -> 1 with overshoot, slight rotation settle
  const progress = spring({
    frame: Math.max(0, frame - atFrame),
    fps,
    config: { mass: 1, damping: 10, stiffness: 220 },
  });
  const scale = interpolate(progress, [0, 1], [0.2, 1]);
  const rotation = interpolate(progress, [0, 1], [-8, 0]);
  const opacityIn = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pop-out in the last 0.25s
  const outStart = atSec + visibleSec - 0.25;
  const outProgress = interpolate(currentTimeSec, [outStart, atSec + visibleSec], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "34%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: opacityIn * (1 - outProgress),
        transform: `scale(${scale * (1 - 0.8 * outProgress)}) rotate(${rotation}deg)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: NEWS_THEME.fontFamily,
          fontWeight: 400,
          fontSize: 110,
          backgroundColor: NEWS_THEME.badgeBg,
          color: NEWS_THEME.badgeColor,
          padding: "14px 30px",
          whiteSpace: "nowrap",
          lineHeight: 1.1,
          boxShadow: "0 14px 50px rgba(0,0,0,0.55)",
        }}
      >
        {text.toUpperCase()}
      </div>
    </div>
  );
};
