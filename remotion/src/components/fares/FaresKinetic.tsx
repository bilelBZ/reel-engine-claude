import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { faresFontFaceCSS, FARES } from "./faresTheme";
import { FaresBackdrop } from "./FaresBackdrop";
import { FaresHero } from "./FaresHero";
import { FaresCaptions } from "./FaresCaptions";
import type { FaresKineticProps } from "./types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * FaresKinetic — the Fares Editorial style as a native claude-shorts
 * composition (JSON-driven).
 *
 * Obsidian stage, floating tech hero graphic w/ crimson aura, giant
 * Cairo Black kinetic captions with red keyword slams, cinematic
 * slow push-in per scene, ember particles throughout.
 */
export const FaresKinetic: React.FC<FaresKineticProps> = ({
  script,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = script.find((s) => t >= s.start && t < s.end);

  // Cinematic slow push-in, per active scene (1.10 → 1.0)
  let camScale = 1.05;
  if (active) {
    const lp = clamp01((t - active.start) / Math.max(0.01, active.end - active.start));
    camScale = interpolate(lp, [0, 1], [1.1, 1.0]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: FARES.bgDark }}>
      <style dangerouslySetInnerHTML={{ __html: faresFontFaceCSS }} />
      {audioSrc ? <Audio src={audioSrc} /> : null}

      <div
        style={{
          position: "absolute",
          inset: -120,
          transform: `scale(${camScale})`,
          transformOrigin: "50% 45%",
        }}
      >
        <FaresBackdrop />

        {active ? (
          <SceneFade
            key={`${active.hero}-${active.start}`}
            localT={t - active.start}
            duration={active.end - active.start}
          >
            <FaresHero kind={active.hero} sceneStart={active.start} />
            <FaresCaptions lines={active.lines} sceneStart={active.start} />
          </SceneFade>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Snappy fade + slight scale for scene enter/exit. */
const SceneFade: React.FC<{ localT: number; duration: number; children: React.ReactNode }> = ({
  localT,
  duration,
  children,
}) => {
  const fadeIn = interpolate(localT, [0, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(localT, [duration - 0.2, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      {children}
    </div>
  );
};
