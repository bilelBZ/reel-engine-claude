import { z } from "zod";

/**
 * Scene types for the arabic-kinetic style. Every scene is a pure
 * motion-graphics beat; all visible text comes from the JSON script.
 *
 * - starburst:   jagged red burst badge + glowing white hook text (hook)
 * - ai-orbit:    robot head + giant latin word w/ orbiting ring + icon tiles
 * - editor:      top line + video-editor window mockup + bottom line
 * - eye:         top line + animated eye w/ rings & speed lines + bottom line
 * - title-cards: big gold title + small line + art cards row + arrow
 * - card-grid:   top line + 2x2 art card grid + big gold word + sparkles
 * - robot-bar:   robot head + icon tile row + orange progress bar + lines
 * - question:    top line + diamond-pixel "?" + bottom line
 * - cta:         line + giant word w/ orbit + line + comment box + final lines
 */
export const ArabicSceneType = z.enum([
  "starburst",
  "ai-orbit",
  "editor",
  "eye",
  "title-cards",
  "card-grid",
  "robot-bar",
  "question",
  "cta",
]);
export type ArabicSceneType = z.infer<typeof ArabicSceneType>;

export const ArabicSceneSchema = z.object({
  type: ArabicSceneType,
  /** Scene start/end in seconds (video-local time). */
  start: z.number(),
  end: z.number(),
  /** Kinetic text lines, top → bottom. Meaning per type, see above. */
  lines: z.array(z.string()).optional().default([]),
  /** Giant latin display word (ai-orbit, cta), e.g. "AI". */
  word: z.string().optional().default(""),
  /** Icon tile names: image | text | audio | play | spark (ai-orbit, robot-bar). */
  icons: z.array(z.string()).optional().default([]),
  /** Art card names: sunset | city | waveform | equalizer (title-cards, card-grid, editor). */
  cards: z.array(z.string()).optional().default([]),
  /** Show the gold arrow (title-cards). */
  arrow: z.boolean().optional().default(false),
  /** Show the robot head (ai-orbit). */
  robot: z.boolean().optional().default(false),
  /** Big gold word under the grid (card-grid), e.g. "بتتنطط!". */
  bigWord: z.string().optional().default(""),
  /** Typed text inside the comment box (cta). Empty = placeholder. */
  comment: z.string().optional().default(""),
  /** Placeholder inside the comment box (cta). */
  commentPlaceholder: z.string().optional().default("أضف تعليقا..."),
});
export type ArabicScene = z.infer<typeof ArabicSceneSchema>;

export const ArabicKineticPropsSchema = z.object({
  /** Ordered scene list — drives the whole video. */
  script: z.array(ArabicSceneSchema),
  /** Total duration in seconds (drives composition length). */
  durationInSeconds: z.number(),
  /** Optional audio URL (served over http by render-arabic.mjs). */
  audioSrc: z.string().optional().default(""),
});
export type ArabicKineticProps = z.infer<typeof ArabicKineticPropsSchema>;
