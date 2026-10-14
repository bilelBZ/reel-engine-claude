import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { VideoFrame } from "./components/VideoFrame";
import { Captions } from "./components/Captions";
import { HookOverlay } from "./components/HookOverlay";
import { ProgressBar } from "./components/ProgressBar";
import { NewsHook } from "./components/NewsHook";
import { NewsBadge } from "./components/NewsBadge";
import { NewsCTA } from "./components/NewsCTA";
import { NewsCover } from "./components/NewsCover";
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
  coverImageSrc,
  coverSec,
}) => {
  const isNews = captionStyle === "news";
  const { fps } = useVideoConfig();

  // Embedded cover: the first coverSec seconds show the title card while the
  // content (video + captions) is delayed behind it via <Sequence>, so the
  // cover never eats into the teaser. Absolute-timed overlays (hook, badge,
  // teaser flash) are shifted by coverSec; the CTA/progress bar are
  // duration-based and need no shift.
  const coverFrames = Math.round((coverSec ?? 0) * fps);
  const totalFrames = Math.round(durationInSeconds * fps);
  const contentFrames = Math.max(1, totalFrames - coverFrames);
  const hasCover = isNews && !!coverImageSrc && (coverSec ?? 0) > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Load custom fonts for captions and hook overlay */}
      <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />

      {/* Content runs on a content-local timeline (delayed by the cover) */}
      <Sequence
        from={coverFrames}
        durationInFrames={contentFrames}
        name="content"
      >
        {/* Reframed video (cropped and scaled to fill 1080x1920) */}
        <VideoFrame
          clipSrc={clipSrc}
          sourceWidth={sourceWidth}
          sourceHeight={sourceHeight}
          crop={crop}
          cropKeyframes={cropKeyframes}
        />

        {/* Animated captions */}
        <Captions captions={captions} style={captionStyle} />
      </Sequence>

      {/* Embedded thumbnail/title card (first coverSec seconds) */}
      {hasCover && (
        <NewsCover src={coverImageSrc ?? ""} coverSec={coverSec ?? 0} />
      )}

      {isNews ? (
        <>
          {/* News style: teaser flash, highlight hook bar, animated badge, end CTA */}
          <TeaserFlash teaserEndSec={teaserEndSec ?? 0} />
          {hookLine1 && <NewsHook text={hookLine1} offsetSec={coverSec ?? 0} />}
          {badgeText && (
            <NewsBadge text={badgeText} atSec={badgeAtSec ?? 0} />
          )}
          {ctaText && (
            <NewsCTA
              text={ctaText}
              showAtSec={Math.max(1, durationInSeconds - 2.4)}
            />
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
