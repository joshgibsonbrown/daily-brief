// Minimal PostgREST client over fetch. We deliberately don't use @supabase/supabase-js:
// it unconditionally initializes a realtime WebSocket client we never use, which crashes
// on Node runtimes without native WebSocket (bit us on Railway). Plain REST calls to
// Supabase's PostgREST endpoint cover everything the archive needs.
// Uses the secret/service-role key — backend-only, never shipped to a browser.

function baseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return `${url}/rest/v1`;
}

function restHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

export async function restInsert(table: string, rows: unknown[]): Promise<void> {
  const res = await fetch(`${baseUrl()}/${table}`, {
    method: "POST",
    headers: { ...restHeaders(), prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert into ${table} failed (${res.status}): ${await res.text()}`);
}

// `filters` is a raw PostgREST query string, e.g. "brief_date=eq.2026-07-09".
export async function restDelete(table: string, filters: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/${table}?${filters}`, {
    method: "DELETE",
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase delete from ${table} failed (${res.status}): ${await res.text()}`);
}

export async function restSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${baseUrl()}/${table}?${query}`, {
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase select from ${table} failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as T[];
}
