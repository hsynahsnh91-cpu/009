import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/explain/route";
const data = { query: "2x+5=15", depth: 2, language: "en" };
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/explain", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
test("HTTP endpoint computes valid algebra and rejects invalid or oversized requests", async () => {
  const valid = await POST(req(JSON.stringify(data)));
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).shortAnswer, "x = 5");
  assert.equal((await POST(req("{"))).status, 400);
  assert.equal(
    (await POST(req(JSON.stringify({ ...data, depth: 0 })))).status,
    400,
  );
  assert.equal((await POST(req("x".repeat(16001)))).status, 413);
  assert.equal(
    (
      await POST(
        req(JSON.stringify(data), { origin: "https://untrusted.example" }),
      )
    ).status,
    403,
  );
});
test("missing provider fails honestly without raw internals", async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const response = await POST(
      req(JSON.stringify({ ...data, query: "What is gravity?" })),
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "unavailable" });
  } finally {
    if (original !== undefined) process.env.OPENAI_API_KEY = original;
  }
});
