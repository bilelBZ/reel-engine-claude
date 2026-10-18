import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { faresFontFaceCSS, FARES, FARES_FONT } from "./faresTheme";
import type { FaresWordByWordProps } from "./types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

interface ParsedWord {
  text: string;
  keyword: boolean;
}

/**
 * Split a caption line into words. Words wrapped in *asterisks* become
 * keywords (electric-red slam). Same parsing as the FaresKinetic captions.
 */
function parseLine(line: string): ParsedWord[] {
  const words: ParsedWord[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushPlain = (s: string) => {
    s
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => words.push({ text: w, keyword: false }));
  };
  while ((m = re.exec(line)) !== null) {
    pushPlain(line.slice(last, m.index));
    m[1]
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => words.push({ text: w, keyword: true }));
    last = m.index + m[0].length;
  }
  pushPlain(line.slice(last));
  return words;
}

/**
 * FaresWordByWord — the Fares Editorial word-by-word kinetic typography
 * as a reusable composition.
 *
 * Giant Cairo Black (RTL) words reveal one by one with a blur-to-sharp
 * snap; *keyword* words slam in electric red with a screen shake.
 * The motion is driven by timed caption lines (each with start/end in
 * seconds) layered over real footage with a cinematic dark grade.
 *
 * Usage: pass clipSrc (real footage), lines (timed captions), and
 * durationInSeconds. Keep lines sequential in time.
 */
export const FaresWordByWord: React.FC<FaresWordByWordProps> = ({
  clipSrc,
  lines,
  durationInSeconds,
  darkGrade = 0.5,
  audioSrc = "",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Cinematic slow push-in on the footage (Fares signature).
  const total = Math.max(0.01, durationInSeconds);
  const camScale = interpolate(clamp01(t / total), [0, 1], [1.0, 1.08]);

  // Screen shake driven by the most recent keyword slam across visible lines.
  let shakeX = 0;
  let shakeY = 0;
  for (const line of lines) {
    if (t < line.start || t >= line.end) continue;
    const words = parseLine(line.text);
    for (let wi = 0; wi < words.length; wi++) {
      if (!words[wi].keyword) continue;
      const slamT = t - (line.start + wi * FARES.wordStagger);
      if (slamT >= 0 && slamT < 0.24) {
        // 3 yoyo shakes over 0.24s, decaying — same as FaresKinetic.
        const k = slamT / 0.24;
        const dir = Math.sin(k * Math.PI * 6) > 0 ? 1 : -1;
        const amp = (1 - k) * 11;
        shakeX = dir * amp;
        shakeY = -dir * amp * 0.66;
      }
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: FARES.bgDark }}>
      <style dangerouslySetInnerHTML={{ __html: faresFontFaceCSS }} />
      {audioSrc ? <Audio src={audioSrc} /> : null}

      <div
        style={{
          position: "absolute",
          inset: -60,
          transform: `scale(${camScale})`,
        }}
      >
        <OffthreadVideo
          src={clipSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Cinematic dark grade + vignette for caption legibility. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,${(
            darkGrade * 0.55
          ).toFixed(2)}) 0%, rgba(0,0,0,${darkGrade.toFixed(2)}) 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${shakeX}px, ${shakeY}px)`,
          zIndex: 10,
        }}
      >
        {lines.map((line, li) => {
          if (t < line.start || t >= line.end) return null;
          const localT = t - line.start;
          const fadeIn = interpolate(localT, [0, 0.12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(t, [line.end - 0.12, line.end], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const words = parseLine(line.text);
          return (
            <div
              key={li}
              style={{
                position: "absolute",
                left: FARES.captionPadding,
                right: FARES.captionPadding,
                direction: "rtl",
                textAlign: "center",
                opacity: Math.min(fadeIn, fadeOut),
              }}
            >
              {words.map((w, i) => (
                <Word key={i} word={w} index={i} localT={localT} />
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * One kinetic word: blur-to-sharp reveal with scale + rise;
 * keywords slam bigger in electric red. Same motion as FaresKinetic.
 */
const Word: React.FC<{ word: ParsedWord; index: number; localT: number }> = ({
  word,
  index,
  localT,
}) => {
  const start = index * FARES.wordStagger;
  const dur = word.keyword ? FARES.keywordSlamDur : FARES.wordRevealDur;
  const p = clamp01((localT - start) / dur);

  if (p <= 0) return null;

  // easeOutCubic for words, easeOutQuart snap for keywords.
  const e = word.keyword ? 1 - Math.pow(1 - p, 4) : 1 - Math.pow(1 - p, 3);

  const scale = word.keyword
    ? interpolate(e, [0, 1], [1.6, 1])
    : interpolate(e, [0, 1], [1.2, 1]);
  const y = word.keyword
    ? interpolate(e, [0, 1], [22, 0])
    : interpolate(e, [0, 1], [12, 0]);
  const blur = word.keyword
    ? interpolate(e, [0, 1], [24, 0])
    : interpolate(e, [0, 1], [14, 0]);

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FARES_FONT,
        fontWeight: 900,
        fontSize: word.keyword ? FARES.keywordFontSize : FARES.wordFontSize,
        color: word.keyword ? FARES.keywordColor : "#FFFFFF",
        textShadow: word.keyword ? FARES.keywordGlow : FARES.wordGlow,
        marginLeft: "0.22em",
        transform: `scale(${scale}) translateY(${y}px)`,
        filter: `blur(${blur}px)`,
        opacity: p,
        transformOrigin: "50% 60%",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      {word.text}
    </span>
  );
};
