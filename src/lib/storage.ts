import { explanationSchema, type Saved, type ExplainRequest } from "./schema";
export const storageKey = "explainx.library.v1";
export function cacheKey(r: ExplainRequest) {
  return JSON.stringify({
    ...r,
    query: r.query
      .trim()
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[?؟]+$/, ""),
  });
}
export function readLibrary(): Saved[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(data)) return [];
    return data.flatMap((v) => {
      const e = explanationSchema.safeParse(v?.explanation);
      return e.success && typeof v.key === "string"
        ? [{ explanation: e.data, favorite: v.favorite === true, key: v.key }]
        : [];
    });
  } catch {
    return [];
  }
}
export function persistLibrary(items: Saved[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}
export async function requestExplanation(
  r: ExplainRequest,
  signal: AbortSignal,
) {
  const response = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
    signal,
  }).catch((error) => {
    if (signal.aborted) throw error;
    throw new Error("network");
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error === "unavailable"
        ? "unavailable"
        : response.status === 429
          ? "rate"
          : "error",
    );
  return explanationSchema.parse(data);
}
