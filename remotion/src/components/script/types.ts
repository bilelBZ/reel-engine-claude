import { z } from "zod";

/**
 * ScriptCards — JSON-driven kinetic text-card composition for the
 * "Say It Save It" money-script format:
 *   hook card → numbered script sentences → CTA card.
 * Pure motion graphics, no footage, no voiceover.
 */

export const ScriptSceneType = z.enum(["hook", "sentence", "cta"]);
export type ScriptSceneType = z.infer<typeof ScriptSceneType>;

export const ScriptSceneSchema = z.object({
  type: ScriptSceneType,
  /** seconds, absolute on the timeline */
  start: z.number(),
  end: z.number(),
  /** main text lines (hook: headline; sentence: the script line; cta: lines) */
  lines: z.array(z.string()),
  /** sentence number (1..7) — only for type=sentence */
  number: z.number().optional(),
  /** words rendered in accent yellow (case-insensitive, punctuation-ignored) — for type=sentence */
  highlightWords: z.array(z.string()).optional(),
  /** line indexes rendered in accent yellow — for type=hook */
  accentLines: z.array(z.number()).optional(),
});
export type ScriptScene = z.infer<typeof ScriptSceneSchema>;

export const ScriptCardsPropsSchema = z.object({
  script: z.array(ScriptSceneSchema),
  durationInSeconds: z.number(),
  /** small brand label shown top-center, e.g. "SAY IT SAVE IT" */
  brand: z.string().optional(),
  /** optional background music bed (http url served by render script) */
  audioSrc: z.string().optional(),
});
export type ScriptCardsProps = z.infer<typeof ScriptCardsPropsSchema>;
