// Extracts and parses the first JSON object from model output. Models occasionally wrap
// JSON in markdown fences or append trailing text despite instructions — slicing from the
// first "{" to the last "}" tolerates all of that without caring what surrounds it.
export function extractJson<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in model output: ${raw.slice(0, 200)}...`);
  }
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

// One retry for calls whose output must parse — a single malformed response shouldn't
// kill the day's brief when a re-ask almost always succeeds.
export async function withJsonRetry<T>(call: () => Promise<string>, parse: (raw: string) => T): Promise<T> {
  const first = await call();
  try {
    return parse(first);
  } catch (err) {
    console.warn(`JSON parse failed, retrying once: ${err instanceof Error ? err.message : err}`);
    const second = await call();
    return parse(second);
  }
}
