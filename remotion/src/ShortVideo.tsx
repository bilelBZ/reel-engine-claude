import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { VideoFrame } from "./components/VideoFrame";
import { Captions } from "./components/Captions";
import { HookOverlay } from "./components/HookOverlay";
import { ProgressBar } from "./components/ProgressBar";
import { NewsHook } from "./components/NewsHook";
import { NewsBadge } from "./components/NewsBadge";
import { NewsCTA } from "./components/NewsCTA";
import { TeaserFlash } from "./components/TeaserFlash";
import { fontFaceCSS } from "./styles/fonts";
import type { ShortVideoProps } from "./types";

export const ShortVideo: React.FC<ShortVideoProps> = ({
  clipSrc,
  sourceWidth,
  sourceHeight,
  crop,
  cropKeyframes,
  captions,
  captionStyle,
  hookLine1,
  hookLine2,
  showProgressBar,
  durationInSeconds,
  ctaText,
  badgeText,
  badgeAtSec,
  teaserEndSec,
}) => {
  const isNews = captionStyle === "news";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // News end-screen: once the CTA takes over, captions hide so the
  // question card sits clean on black (no caption bleed-through).
  const ctaShowAtSec = Math.max(1, durationInSeconds - 2.4);
  const ctaActive = isNews && !!ctaText && frame / fps >= ctaShowAtSec;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Load custom fonts for captions and hook overlay */}
      <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />

      {/* Reframed video (cropped and scaled to fill 1080x1920) */}
      <VideoFrame
        clipSrc={clipSrc}
        sourceWidth={sourceWidth}
        sourceHeight={sourceHeight}
        crop={crop}
        cropKeyframes={cropKeyframes}
      />

      {/* Animated captions (hidden once the news end-screen CTA takes over) */}
      {!ctaActive && <Captions captions={captions} style={captionStyle} />}

      {isNews ? (
        <>
          {/* News style: teaser flash, highlight hook bar, animated badge, end CTA */}
          <TeaserFlash teaserEndSec={teaserEndSec ?? 0} />
          {hookLine1 && <NewsHook text={hookLine1} />}
          {badgeText && (
            <NewsBadge text={badgeText} atSec={badgeAtSec ?? 0} />
          )}
          {ctaText && (
            <NewsCTA text={ctaText} showAtSec={ctaShowAtSec} />
          )}
        </>
      ) : (
        <>
          {/* Hook text overlay (first 3.5 seconds) */}
          {(hookLine1 || hookLine2) && (
            <HookOverlay line1={hookLine1 ?? ""} line2={hookLine2 ?? ""} />
          )}
        </>
      )}

      {/* Progress bar at bottom */}
      {showProgressBar && (
        <ProgressBar durationInSeconds={durationInSeconds} />
      )}
    </AbsoluteFill>
  );
};
