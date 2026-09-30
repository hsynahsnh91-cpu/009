import { requestSchema } from "@/lib/schema";
import { algebraExplanation } from "@/lib/algebra";
import { generateExplanation } from "@/lib/ai";
export const runtime = "nodejs";
// Per-instance protection; use an authenticated distributed limiter for public deployment.
const requests = new Map<string, { count: number; until: number }>();
async function readBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("invalid");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) {
      await reader.cancel();
      throw new Error("large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(body));
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (
      origin &&
      new URL(origin).host !== req.headers.get("host") &&
      new URL(origin).host !== req.headers.get("x-forwarded-host")
    )
      return Response.json({ error: "forbidden" }, { status: 403 });
    let data: unknown;
    try {
      data = await readBody(req);
    } catch (e) {
      return Response.json(
        { error: "invalid" },
        { status: e instanceof Error && e.message === "large" ? 413 : 400 },
      );
    }
    const parsed = requestSchema.safeParse(data);
    if (!parsed.success)
      return Response.json({ error: "invalid" }, { status: 400 });
    const local = algebraExplanation(parsed.data);
    if (local) return Response.json(local);
    if (!process.env.OPENAI_API_KEY)
      return Response.json({ error: "unavailable" }, { status: 503 });
    const now = Date.now();
    for (const [k, v] of requests) if (v.until < now) requests.delete(k);
    const key = req.headers.get("x-forwarded-for")?.split(",")[0] || "shared";
    const entry = requests.get(key) || { count: 0, until: now + 60000 };
    if (entry.count >= 12 || requests.size > 10000)
      return Response.json({ error: "rate" }, { status: 429 });
    entry.count++;
    requests.set(key, entry);
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(60000)]);
    return Response.json(await generateExplanation(parsed.data, signal));
  } catch {
    return Response.json({ error: "invalid" }, { status: 502 });
  }
}
