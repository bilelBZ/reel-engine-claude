import { z } from "zod";

/**
 * MoneyCards (dollarmindlab-style): static infographic reel.
 * Scenic full-bleed background + white top transformation bar +
 * numbered black-box points + white bottom CTA box. JSON-driven so
 * future topics are a script swap.
 */
export const MoneyCardsPropsSchema = z.object({
  bgSrc: z.string().describe("http(s) URL of the background video"),
  audioSrc: z.string().describe("http(s) URL of the soundtrack"),
  topBar: z.string().describe('Transformation hook, e.g. "Internet Bill: $85 → CUT"'),
  points: z
    .array(z.string())
    .describe("Numbered script points, each rendered as black pill-box lines"),
  cta: z.string().describe('Bottom CTA, e.g. "Got ... right now? YES or NO 👉"'),
  hook: z
    .string()
    .optional()
    .default("")
    .describe("Full-screen opening hook text, shown ~1.5s before cards"),
  durationInSeconds: z.number().positive(),
});

export type MoneyCardsProps = z.infer<typeof MoneyCardsPropsSchema>;
