import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PopWords } from "./PopWords";
import type { ScriptScene } from "./types";

export const YELLOW = "#FFD60A";
export const INK = "#0A0A0A";

/** Shared dark backdrop with a soft warm glow. */
export const CardBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse 90% 55% at 50% 30%, #1a1a10 0%, #0a0a0a 60%, #060606 100%)",
    }}
  />
);

const popIn = (frame: number, fps: number, delay = 0) =>
  spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 180 } });

/** Big Anton headline card (video hook). */
export const HookScene: React.FC<{ scene: ScriptScene; frameOffset: number }> = ({
  scene,
  frameOffset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accentLines = new Set(scene.accentLines ?? []);
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {scene.lines.map((line, i) => {
          const p = popIn(frame - frameOffset, fps, i * 5);
          const accent = accentLines.has(i);
          return (
            <div
              key={i}
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: 118,
                lineHeight: 1.08,
                letterSpacing: 1,
                color: accent ? YELLOW : "#FFFFFF",
                opacity: p,
                transform: `scale(${(0.7 + 0.3 * p).toFixed(3)}) translateY(${((1 - p) * 40).toFixed(1)}px)`,
                filter: `blur(${((1 - p) * 12).toFixed(1)}px)`,
                textShadow: accent
                  ? "0 0 34px rgba(255,214,10,0.6), 0 4px 0 rgba(0,0,0,0.9)"
                  : "0 4px 0 rgba(0,0,0,0.9), 0 0 22px rgba(0,0,0,0.6)",
                textAlign: "center",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Numbered script-sentence card: giant number + kinetic sentence. */
export const SentenceScene: React.FC<{
  scene: ScriptScene;
  frameOffset: number;
  index: number;
  total: number;
}> = ({ scene, frameOffset, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numPop = popIn(frame - frameOffset, fps, 0);
  const text = scene.lines.join(" ");
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 84px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 34,
          marginTop: -60,
        }}
      >
        <div
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: 190,
            lineHeight: 1,
            color: YELLOW,
            opacity: numPop,
            transform: `scale(${(0.5 + 0.5 * numPop).toFixed(3)}) rotate(${((1 - numPop) * -10).toFixed(1)}deg)`,
            textShadow: "0 0 44px rgba(255,214,10,0.5), 0 5px 0 rgba(0,0,0,0.9)",
          }}
        >
          {scene.number ?? index + 1}
        </div>
        <PopWords
          text={text}
          highlightWords={scene.highlightWords}
          fontSize={66}
          frameOffset={frameOffset + 8}
          stagger={3}
          maxWidth={880}
        />
        <div
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 6,
            color: "rgba(255,255,255,0.45)",
            opacity: Math.min(1, Math.max(0, (frame - frameOffset - 20) / 10)),
          }}
        >
          {scene.number ?? index + 1} / {total}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** End card: save prompt + follow pill. */
export const CTAScene: React.FC<{ scene: ScriptScene; frameOffset: number }> = ({
  scene,
  frameOffset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p1 = popIn(frame - frameOffset, fps, 0);
  const p2 = popIn(frame - frameOffset, fps, 10);
  const pill = popIn(frame - frameOffset, fps, 22);
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        {scene.lines.slice(0, 2).map((line, i) => {
          const p = i === 0 ? p1 : p2;
          return (
            <div
              key={i}
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: i === 0 ? 108 : 96,
                lineHeight: 1.1,
                textAlign: "center",
                color: "#FFFFFF",
                opacity: p,
                transform: `translateY(${((1 - p) * 44).toFixed(1)}px) scale(${(0.8 + 0.2 * p).toFixed(3)})`,
                filter: `blur(${((1 - p) * 10).toFixed(1)}px)`,
                textShadow: "0 4px 0 rgba(0,0,0,0.9), 0 0 22px rgba(0,0,0,0.6)",
              }}
            >
              {line}
            </div>
          );
        })}
        {scene.lines[2] && (
          <div
            style={{
              marginTop: 18,
              background: YELLOW,
              borderRadius: 60,
              padding: "26px 54px",
              opacity: pill,
              transform: `scale(${(0.6 + 0.4 * pill).toFixed(3)})`,
              boxShadow: "0 0 44px rgba(255,214,10,0.45)",
            }}
          >
            <div
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 38,
                letterSpacing: 2,
                color: INK,
                textAlign: "center",
              }}
            >
              {scene.lines[2]}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
