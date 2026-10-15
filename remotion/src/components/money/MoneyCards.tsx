import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import type { MoneyCardsProps } from "./types";

const FONT = "'Noto Sans Display', 'Arial Black', sans-serif";

/**
 * MoneyCards — DollarMindLab-style static infographic reel.
 *
 * Layout grammar (matches the reference exactly):
 * - Full-bleed high-energy background (action footage) with a visible
 *   Ken Burns push-in + diagonal drift, so motion is unmistakable.
 * - TOP: white rounded bar, black heavy text — "X → Y" transformation hook.
 * - BODY: numbered points; each point is white heavy text on black
 *   per-line pill highlights (box-decoration-break: clone), stacked,
 *   all visible at once.
 * - BOTTOM: white rounded box, black heavy text — YES/NO engagement CTA.
 * - Soundtrack bed, no voiceover.
 */
export const MoneyCards: React.FC<MoneyCardsProps> = ({
  bgSrc,
  audioSrc,
  topBar,
  points,
  cta,
  hook = "",
  durationInSeconds,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Hook opener: full-screen bold text for the first ~1.5s, then reveal.
  const hookFrames = Math.round(fps * 1.5);
  const hookOpacity = interpolate(frame, [0, 8, hookFrames - 8, hookFrames + 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hookScale = interpolate(frame, [0, hookFrames], [1.25, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main content stays hidden while the hook opener plays, then fades in.
  const contentOpacity = interpolate(frame, [hookFrames - 2, hookFrames + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Visible Ken Burns drift: push-in 1.06 -> 1.16 plus a slow diagonal
  // pan, so the background unmistakably moves even under heavy text.
  // (Bilel 2026-10-14: background MUST visibly move.)
  const bgScale = interpolate(frame, [0, durationInFrames], [1.06, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgPanX = interpolate(frame, [0, durationInFrames], [0, -36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgPanY = interpolate(frame, [0, durationInFrames], [0, 24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  void durationInSeconds;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <OffthreadVideo
          src={bgSrc}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale}) translate(${bgPanX}px, ${bgPanY}px)`,
          }}
        />
      </AbsoluteFill>

      {/* Main content (hidden during hook opener) */}
      <div style={{ position: "absolute", inset: 0, opacity: contentOpacity }}>
      {/* TOP transformation bar */}
      <div
        style={{
          position: "absolute",
          top: 55,
          left: 8,
          right: 8,
          backgroundColor: "#ffffff",
          borderRadius: 26,
          padding: "30px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 88,
            color: "#000000",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          {topBar}
        </div>
      </div>

      {/* BODY numbered points */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 40,
          right: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        {points.map((point, i) => (
          <div
            key={i}
            style={{
              maxWidth: 1000,
              textAlign: "center",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 40,
              color: "#ffffff",
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                backgroundColor: "#000000",
                borderRadius: 16,
                padding: "8px 22px",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {point}
            </span>
          </div>
        ))}
      </div>

      {/* BOTTOM CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 90,
          right: 90,
          backgroundColor: "#ffffff",
          borderRadius: 24,
          padding: "26px 30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 44,
            color: "#000000",
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          {cta}
        </div>
      </div>
      </div>

      <Audio src={audioSrc} />

      {/* HOOK opener: full-screen bold text, first ~1.5s */}
      {hook && hookOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "rgba(0,0,0,0.62)",
            justifyContent: "center",
            alignItems: "center",
            opacity: hookOpacity,
            padding: 60,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 110,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: -2,
              transform: `scale(${hookScale})`,
              textShadow: "0 6px 40px rgba(0,0,0,0.8)",
            }}
          >
            {hook}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
