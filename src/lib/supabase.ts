import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | undefined;

// Uses the secret/service-role key — this only ever runs on the Railway backend,
// never in a browser, so it's fine to bypass RLS.
//
// Not using createClient's generated-types generic here — it requires a specific
// "__InternalSupabase" schema shape that's brittle to hand-write and easy to break
// across supabase-js versions. archive.ts types its own rows/queries explicitly instead.
export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("SUPABASE_URL is not set");
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    client = createClient(url, key);
  }
  return client;
}
