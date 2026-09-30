import { test } from "node:test";
import assert from "node:assert/strict";
import { solveLinear, algebraExplanation } from "../src/lib/algebra";
import {
  explanationSchema,
  parseContent,
  requestSchema,
  type ExplainRequest,
} from "../src/lib/schema";
import { cacheKey, readLibrary, persistLibrary } from "../src/lib/storage";
import { documentText } from "../src/lib/export";
import { generateExplanation } from "../src/lib/ai";
const r: ExplainRequest = {
  query: "2x + 5 = 15",
  depth: 2,
  language: "en",
  category: "auto",
  visualize: true,
  mode: "explain",
};
test("deterministic solver handles signs, decimal coefficients and degenerate equations", () => {
  assert.equal(solveLinear(r.query)?.x, 5);
  assert.equal(solveLinear("-2x + 4 = 10")?.x, -3);
  assert.equal(solveLinear("x − 5 = 10")?.x, 15);
  assert.equal(solveLinear("0.5x + 1 = 3")?.x, 4);
  assert.equal(solveLinear("0x+5=5")?.x, null);
  assert.match(
    algebraExplanation({ ...r, query: "0x+5=5" })!.shortAnswer,
    /Every value/,
  );
  assert.match(
    algebraExplanation({ ...r, query: "0x+5=6" })!.shortAnswer,
    /no solution/,
  );
  for (const q of [
    "process.exit()",
    "2x^2=4",
    "2x+5=15;alert(1)",
    "sin(x)=1",
    "x/0=4",
  ])
    assert.equal(solveLinear(q), null);
});
test("every supported depth and language validates; depth changes reasoning", () => {
  for (const language of ["en", "ar"] as const)
    for (let depth = 1; depth <= 5; depth++) {
      const e = algebraExplanation({ ...r, depth, language });
      assert.ok(explanationSchema.safeParse(e).success);
    }
  const simple = algebraExplanation({ ...r, depth: 1 })!,
    expert = algebraExplanation({ ...r, depth: 5 })!;
  assert.notEqual(simple.sections[0].content, expert.sections[0].content);
  assert.ok(expert.sections.some((s) => s.title === "Sensitivity"));
  assert.ok(
    algebraExplanation({ ...r, mode: "simplify" })!.sections.some(
      (s) => s.kind === "analogy",
    ),
  );
});
test("request bounds, nested output validation and safe fenced JSON recovery", () => {
  assert.equal(requestSchema.safeParse({ ...r, depth: 6 }).success, false);
  assert.equal(requestSchema.safeParse({ ...r, query: " " }).success, false);
  assert.equal(
    requestSchema.safeParse({ ...r, query: "x".repeat(1201) }).success,
    false,
  );
  const e = algebraExplanation(r)!;
  assert.equal(
    parseContent("```json\n" + JSON.stringify(e) + "\n```").topic,
    e.topic,
  );
  assert.throws(() => parseContent("{}"));
  assert.throws(() => parseContent(JSON.stringify({ ...e, sections: [null] })));
  assert.throws(() =>
    parseContent(
      JSON.stringify({ ...e, quiz: [{ ...e.quiz[0], answer: 99 }] }),
    ),
  );
  assert.throws(() => parseContent("x".repeat(60001)));
});
test("cache normalization preserves mathematical operators and learning context", () => {
  assert.equal(
    cacheKey({ ...r, query: "What is Gravity?" }),
    cacheKey({ ...r, query: " what is gravity? " }),
  );
  assert.notEqual(
    cacheKey({ ...r, query: "2x+5=15" }),
    cacheKey({ ...r, query: "2x-5=15" }),
  );
  assert.notEqual(cacheKey(r), cacheKey({ ...r, depth: 4 }));
  assert.notEqual(cacheKey(r), cacheKey({ ...r, context: "another topic" }));
  assert.notEqual(cacheKey(r), cacheKey({ ...r, language: "ar" }));
});
test("storage corruption and quota failure do not crash; exports contain actual content", () => {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => "{",
      setItem: () => {
        throw new Error("quota");
      },
    },
    configurable: true,
  });
  assert.deepEqual(readLibrary(), []);
  assert.equal(persistLibrary([]), false);
  const text = documentText(algebraExplanation(r)!);
  assert.match(text, /x = 5/);
  assert.match(text, /Step by step/);
  assert.match(text, /Which operation/);
});
test("AI adapter performs one controlled recovery and rejects invalid output", async () => {
  const original = globalThis.fetch;
  const e = algebraExplanation(r)!;
  let calls = 0;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          { message: { content: ++calls === 1 ? "{}" : JSON.stringify(e) } },
        ],
      }),
      { status: 200 },
    );
  try {
    const result = await generateExplanation(r, new AbortController().signal);
    assert.equal(result.source, "ai");
    assert.equal(calls, 2);
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "{}" } }] }),
      );
    await assert.rejects(generateExplanation(r, new AbortController().signal));
  } finally {
    globalThis.fetch = original;
  }
});
