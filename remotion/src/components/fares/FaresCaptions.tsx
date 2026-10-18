import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FARES, FARES_FONT } from "./faresTheme";

interface ParsedWord {
  text: string;
  keyword: boolean;
}

function parseLine(line: string): ParsedWord[] {
  const words: ParsedWord[] = [];
  // Split keeping *keyword* markers; keyword may span multiple words: *a b*
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushPlain = (s: string) => {
    s.split(/\s+/).filter(Boolean).forEach((w) => words.push({ text: w, keyword: false }));
  };
  while ((m = re.exec(line)) !== null) {
    pushPlain(line.slice(last, m.index));
    m[1].split(/\s+/).filter(Boolean).forEach((w) => words.push({ text: w, keyword: true }));
    last = m.index + m[0].length;
  }
  pushPlain(line.slice(last));
  return words;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Fares kinetic captions: giant Cairo Black RTL words, staggered
 * blur-to-sharp reveals; *keyword* slams in electric red with
 * screen shake. Caption block sits below the hero stage.
 */
export const FaresCaptions: React.FC<{ lines: string[]; sceneStart: number }> = ({
  lines,
  sceneStart,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localT = frame / fps - sceneStart;

  const words: ParsedWord[] = lines.flatMap(parseLine);

  // Screen shake driven by the most recent keyword slam
  let shakeX = 0;
  let shakeY = 0;
  let wi = 0;
  for (const w of words) {
    const start = 0.15 + wi * FARES.wordStagger;
    if (w.keyword) {
      const slamT = localT - start;
      if (slamT >= 0 && slamT < 0.24) {
        // 3 yoyo shakes over 0.24s, decaying
        const k = slamT / 0.24;
        const dir = Math.sin(k * Math.PI * 6) > 0 ? 1 : -1;
        const amp = (1 - k) * 11;
        shakeX = dir * amp;
        shakeY = -dir * amp * 0.66;
      }
    }
    wi++;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: FARES.captionPadding,
        right: FARES.captionPadding,
        top: `${FARES.captionTop * 100}%`,
        bottom: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        direction: "rtl",
        textAlign: "center",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
        zIndex: 35,
      }}
    >
      {lines.map((line, li) => {
        const lineWords = parseLine(line);
        const offset = lines.slice(0, li).flatMap(parseLine).length;
        return (
          <div key={li} style={{ marginBottom: 10, lineHeight: 1.25 }}>
            {lineWords.map((w, i) => (
              <Word key={i} word={w} index={offset + i} localT={localT} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const Word: React.FC<{ word: ParsedWord; index: number; localT: number }> = ({
  word,
  index,
  localT,
}) => {
  const start = 0.15 + index * FARES.wordStagger;
  const dur = word.keyword ? FARES.keywordSlamDur : FARES.wordRevealDur;
  const p = clamp01((localT - start) / dur);

  // easeOutCubic for words, easeOutQuart-ish snap for keywords
  const e = word.keyword ? 1 - Math.pow(1 - p, 4) : 1 - Math.pow(1 - p, 3);

  const scale = word.keyword
    ? interpolate(e, [0, 1], [1.6, 1])
    : interpolate(e, [0, 1], [1.2, 1]);
  const y = word.keyword ? interpolate(e, [0, 1], [22, 0]) : interpolate(e, [0, 1], [12, 0]);
  const blur = word.keyword ? interpolate(e, [0, 1], [24, 0]) : interpolate(e, [0, 1], [14, 0]);
  const opacity = p;

  if (p <= 0) return <span style={{ display: "inline-block", width: 0, overflow: "hidden" }}>{""}</span>;

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
        opacity,
        transformOrigin: "50% 60%",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
      }}
    >
      {word.text}
    </span>
  );
};
