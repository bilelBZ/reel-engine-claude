import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface TeaserFlashProps {
  /** Time (seconds, clip-local) where the teaser ends and the main passage begins. 0 = disabled. */
  teaserEndSec: number;
}

/**
 * Teaser flash transition: white flash at the teaser -> main cut point
 * (teaser 0–3s, strongest moment first), then dissolves in 0.14s.
 *
 * Ported from kinetic-reel-engine "news-viral" teaserFlash.
 */
export const TeaserFlash: React.FC<TeaserFlashProps> = ({ teaserEndSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!teaserEndSec || teaserEndSec <= 0) return null;

  const tFrame = teaserEndSec * fps;

  const opacity = interpolate(
    frame,
    [tFrame, tFrame + 0.07 * fps, tFrame + 0.21 * fps],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "white",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
