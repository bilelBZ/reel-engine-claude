import { z } from "zod";

/**
 * Fares scene schema (JSON-driven).
 *
 * - hero: which tech graphic to float in the hero stage
 * - lines: caption lines; wrap the keyword in *asterisks* for the red slam
 * - start/end: scene time range in seconds
 */
export const FaresHeroKind = z.enum([
  "hourglass", // time slipping away
  "film", // video strip / play
  "textlines", // kinetic text lines
  "eye", // eye-catching cover
  "wand", // magic creation spark
  "robot", // AI robot + tool name
  "rocket", // CTA launch
]);
export type FaresHeroKind = z.infer<typeof FaresHeroKind>;

export const FaresSceneSchema = z.object({
  start: z.number(),
  end: z.number(),
  hero: FaresHeroKind,
  lines: z.array(z.string()).min(1),
});
export type FaresScene = z.infer<typeof FaresSceneSchema>;

export const FaresKineticPropsSchema = z.object({
  script: z.array(FaresSceneSchema),
  durationInSeconds: z.number(),
  audioSrc: z.string().optional().default(""),
});
export type FaresKineticProps = z.infer<typeof FaresKineticPropsSchema>;

/**
 * FaresWordByWord props (reusable word-by-word kinetic typography).
 *
 * - clipSrc: real footage to layer the typography over
 * - lines: timed caption lines; wrap the keyword in *asterisks* for the
 *   red slam; keep lines sequential in time
 * - start/end: line time range in seconds
 */
export const FaresTimedLineSchema = z.object({
  text: z.string().min(1),
  start: z.number().min(0),
  end: z.number().min(0),
});
export type FaresTimedLine = z.infer<typeof FaresTimedLineSchema>;

export const FaresWordByWordPropsSchema = z.object({
  clipSrc: z.string(),
  lines: z.array(FaresTimedLineSchema).min(1),
  durationInSeconds: z.number(),
  darkGrade: z.number().min(0).max(1).optional().default(0.5),
  audioSrc: z.string().optional().default(""),
});
export type FaresWordByWordProps = z.infer<typeof FaresWordByWordPropsSchema>;
