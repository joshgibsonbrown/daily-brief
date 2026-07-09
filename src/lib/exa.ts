import type { Candidate } from "../types.js";

const EXA_API_URL = "https://api.exa.ai/search";

interface ExaResult {
  title: string;
  url: string;
  publishedDate?: string;
  text?: string;
}

// Search + full content in one call (Exa's "contents" option), scoped to the last 48h
// so candidates are always same-day-relevant news, not evergreen explainers.
export async function searchNews(query: string, numResults = 6): Promise<Candidate[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY is not set");

  const startDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const res = await fetch(EXA_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults,
      startPublishedDate: startDate,
      type: "auto",
      contents: {
        text: { maxCharacters: 8000 },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Exa search failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { results: ExaResult[] };

  return data.results
    .filter((r) => r.text && r.text.length > 200)
    .map((r) => ({
      title: r.title,
      url: r.url,
      content: r.text ?? "",
      publishedDate: r.publishedDate,
    }));
}
