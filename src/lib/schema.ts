import { z } from "zod";
export const categories = [
  "General",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Programming",
  "Engineering",
  "Astronomy",
  "Technology",
  "History",
  "Geography",
  "Economics",
  "Psychology",
] as const;
const text = z.string().trim().min(1).max(5000);
export const requestSchema = z.object({
  query: z.string().trim().min(1).max(1200),
  depth: z.number().int().min(1).max(5),
  language: z.enum(["en", "ar"]),
  category: z.enum(["auto", ...categories]).default("auto"),
  visualize: z.boolean().default(true),
  context: z.string().max(6000).optional(),
  mode: z.enum(["explain", "why", "simplify"]).default("explain"),
});
export const contentSchema = z.object({
  topic: z.string().min(1).max(160),
  category: z.enum(categories),
  shortAnswer: text,
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        kind: z.enum([
          "idea",
          "steps",
          "example",
          "analogy",
          "equation",
          "code",
          "misconception",
          "limitation",
          "summary",
        ]),
        content: text,
      }),
    )
    .min(1)
    .max(15),
  concepts: z.array(z.string().min(1).max(60)).max(8),
  quiz: z
    .array(
      z
        .object({
          question: text,
          options: z.array(z.string().min(1).max(500)).min(2).max(5),
          answer: z.number().int().min(0),
          explanation: text,
        })
        .refine((q) => q.answer < q.options.length),
    )
    .max(3),
  followUps: z.array(z.string().min(1).max(180)).max(5),
});
export const explanationSchema = contentSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  depth: z.number().int().min(1).max(5),
  language: z.enum(["en", "ar"]),
  source: z.enum(["ai", "calculated"]),
  visualize: z.boolean().default(false),
});
export type Explanation = z.infer<typeof explanationSchema>;
export type ExplainRequest = z.infer<typeof requestSchema>;
export type Language = "en" | "ar";
export type Saved = {
  explanation: Explanation;
  favorite: boolean;
  key: string;
};
export function parseContent(raw: string) {
  if (raw.length > 60000) throw new Error("invalid");
  return contentSchema.parse(
    JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")),
  );
}
