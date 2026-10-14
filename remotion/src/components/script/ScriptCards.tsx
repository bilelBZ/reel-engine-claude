import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFaceCSS } from "../../styles/fonts";
import { CardBackground, HookScene, SentenceScene, CTAScene } from "./Scenes";
import type { ScriptCardsProps } from "./types";

/**
 * ScriptCards — kinetic text-card composition for "Say It Save It"
 * money scripts. JSON-driven: hook → numbered sentences → CTA.
 * No footage, no voiceover. Optional background music bed via audioSrc.
 */
export const ScriptCards: React.FC<ScriptCardsProps> = ({
  script,
  brand,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sentenceScenes = script.filter((s) => s.type === "sentence");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />
      <CardBackground />

      {brand && (
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 10,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {brand}
        </div>
      )}

      {script.map((scene, i) => {
        if (t < scene.start || t >= scene.end) return null;
        const frameOffset = Math.round(scene.start * fps);
        if (scene.type === "hook") {
          return <HookScene key={i} scene={scene} frameOffset={frameOffset} />;
        }
        if (scene.type === "sentence") {
          return (
            <SentenceScene
              key={i}
              scene={scene}
              frameOffset={frameOffset}
              index={sentenceScenes.indexOf(scene)}
              total={sentenceScenes.length}
            />
          );
        }
        return <CTAScene key={i} scene={scene} frameOffset={frameOffset} />;
      })}

      {/* NOTE: audioSrc is reserved for a future background-music bed.
          Wiring it requires Remotion's <Audio> component with volume control;
          a plain <audio> tag does not render into the output. This video
          ships without a baked-in bed — Bilel adds the trending audio
          inside the Facebook app at publish time. */}
    </AbsoluteFill>
  );
};
