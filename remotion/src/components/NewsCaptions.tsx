import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { NEWS_THEME } from "../styles/newsTheme";
import type { Caption } from "../types";

interface NewsCaptionsProps {
  captions: Caption[];
}

interface NewsToken {
  text: string;
  fromMs: number;
  toMs: number;
}

interface NewsPage {
  startMs: number;
  endMs: number;
  tokens: NewsToken[];
}

const MAX_WORDS_PER_PAGE = 3;
const MAX_GAP_MS = 800;

/**
 * Deterministic TikTok-style paging: 2–3 words per page, break on sentence
 * punctuation or on speech gaps > 800ms. Does NOT depend on whitespace
 * quirks of the caption source (unlike createTikTokStyleCaptions, which
 * merges everything into one giant page when words lack leading spaces).
 */
function buildNewsPages(captions: Caption[]): NewsPage[] {
  const pages: NewsPage[] = [];
  let cur: NewsToken[] = [];

  const flush = () => {
    if (cur.length > 0) {
      pages.push({
        startMs: cur[0].fromMs,
        endMs: cur[cur.length - 1].toMs,
        tokens: cur,
      });
      cur = [];
    }
  };

  captions.forEach((c, i) => {
    const prev = i > 0 ? captions[i - 1] : null;
    if (prev && cur.length > 0) {
      const gap = c.startMs - prev.endMs;
      const prevEndsSentence = /[.!?…:;؟]$/.test(prev.text.trim());
      if (
        cur.length >= MAX_WORDS_PER_PAGE ||
        gap > MAX_GAP_MS ||
        prevEndsSentence
      ) {
        flush();
      }
    }
    const text = c.text.trim();
    if (text !== "") {
      cur.push({ text, fromMs: c.startMs, toMs: c.endMs });
    }
  });
  flush();
  return pages;
}

/**
 * News-style karaoke captions: Anton, white text, ACTIVE word highlighted
 * yellow in real time. Each word pops in (blur 12px -> 0, scale 1.35 -> 1)
 * at its own timestamp, then lights up yellow while spoken.
 *
 * Font: Anton (latin)
 * Words per page: 2-3 (deterministic paging, 800ms max gap)
 * Position: bottom 350px (above platform UI chrome)
 */
export const NewsCaptions: React.FC<NewsCaptionsProps> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const pages = useMemo(() => buildNewsPages(captions ?? []), [captions]);

  const currentPage = pages.find(
    (p) => currentTimeMs >= p.startMs && currentTimeMs < p.endMs
  );

  if (!currentPage) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 350,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      {currentPage.tokens.map((token, i) => {
        const isActive =
          currentTimeMs >= token.fromMs && currentTimeMs < token.toMs;

        // Per-word entrance pop at the word's own timestamp
        const wordStartFrame = Math.floor((token.fromMs / 1000) * fps);
        const progress = spring({
          frame: Math.max(0, frame - wordStartFrame),
          fps,
          config: { mass: 1, damping: 14, stiffness: 260 },
        });
        const scale = interpolate(progress, [0, 1], [1.35, isActive ? 1.18 : 1]);
        const blur = interpolate(progress, [0, 1], [12, 0]);
        const opacity = interpolate(progress, [0, 0.4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={`${currentPage.startMs}-${i}`}
            style={{
              fontFamily: NEWS_THEME.fontFamily,
              fontWeight: 400,
              fontSize: 80,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              color: isActive
                ? NEWS_THEME.activeWordColor
                : NEWS_THEME.captionColor,
              textShadow: isActive
                ? NEWS_THEME.activeWordGlow
                : NEWS_THEME.captionShadow,
              lineHeight: 1.15,
              textAlign: "center",
              opacity,
              transform: `scale(${scale})`,
              filter: `blur(${blur}px)`,
            }}
          >
            {token.text.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};
