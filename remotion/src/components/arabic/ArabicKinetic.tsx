import { AbsoluteFill, Audio, useCurrentFrame } from "remotion";
import { cairoBlackFontFaceCSS } from "../../styles/fonts";
import { BackgroundGlow, Sparkles, SceneTransition } from "./Particles";
import { ArabicSceneRenderer } from "./Scenes";
import type { ArabicKineticProps } from "./types";

/**
 * ArabicKinetic — pure motion-graphics composition (no video clip).
 *
 * A JSON `script` (array of timed scenes) drives the whole video:
 * starburst hooks, orbiting "AI" words, an animated eye, editor mockups,
 * art-card grids, a diamond-pixel question mark and a comment-box CTA —
 * all in Cairo Black, RTL, red/black/gold.
 */
export const ArabicKinetic: React.FC<ArabicKineticProps> = ({
  script,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const active = script.find((s) => t >= s.start && t < s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0506" }}>
      <style dangerouslySetInnerHTML={{ __html: cairoBlackFontFaceCSS }} />
      {audioSrc ? <Audio src={audioSrc} /> : null}

      {/* persistent atmosphere */}
      <BackgroundGlow />
      <Sparkles count={16} seed={7} area={{ x: 40, y: 100, w: 1000, h: 1720 }} goldRatio={0.4} />

      {/* active scene with enter/exit transition */}
      {active ? (
        <SceneTransition
          key={`${active.type}-${active.start}`}
          localT={t - active.start}
          duration={active.end - active.start}
        >
          <ArabicSceneRenderer scene={active} />
        </SceneTransition>
      ) : null}
    </AbsoluteFill>
  );
};
