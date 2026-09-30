import type { Explanation } from "./schema";
export function documentText(e: Explanation, md = true) {
  return (
    `${md ? "# " : ""}${e.topic}\n\n${e.category} · ${e.depth}/5 · ${e.createdAt.slice(0, 10)}\n\n${e.shortAnswer}\n\n` +
    e.sections
      .map((s) => `${md ? "## " : ""}${s.title}\n\n${s.content}`)
      .join("\n\n") +
    "\n\n" +
    e.quiz
      .map(
        (q) =>
          `${q.question}\n${q.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n✓ ${q.options[q.answer]}\n${q.explanation}`,
      )
      .join("\n\n") +
    "\n\n" +
    e.followUps.join("\n")
  );
}
export function download(e: Explanation, format: "md" | "txt") {
  const url = URL.createObjectURL(
    new Blob([documentText(e, format === "md")], {
      type: "text/plain;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.topic.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 60)}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
