import { complete } from "../lib/anthropic.js";
import { loadPrompt } from "../lib/prompts.js";
import { MODELS } from "../config/models.js";
import { BUCKETS, type Bucket } from "../config/buckets.js";
import type { BucketedCandidate } from "./fetch-candidates.js";

export interface Selection {
  bucket: Bucket;
  url: string;
  reason: string;
}

function formatCandidates(items: BucketedCandidate[]): string {
  return items
    .map((c, i) => `${i + 1}. [${c.bucket}] ${c.title}\nURL: ${c.url}\nExcerpt: ${c.content.slice(0, 500)}`)
    .join("\n\n");
}

function formatBucketWeights(): string {
  return [...BUCKETS]
    .sort((a, b) => b.weight - a.weight)
    .map((b) => `- ${b.label} (id: ${b.id}) — weight ${b.weight}/5`)
    .join("\n");
}

function parseJson(raw: string): { selections: Selection[] } {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned) as { selections: Selection[] };
}

// Picks 3-5 candidates worth writing up today. Runs on cheap metadata (title + excerpt),
// not full articles, and BEFORE any story gets written — this is the gate that keeps us
// from paying for full write-ups on every candidate.
export async function curate(items: BucketedCandidate[]): Promise<Selection[]> {
  const prompt = await loadPrompt("curate", {
    candidates: formatCandidates(items),
    bucket_weights: formatBucketWeights(),
  });
  const raw = await complete({
    model: MODELS.writer,
    system: "You are a discerning news editor with strong, opinionated judgment about what's worth covering.",
    user: prompt,
    maxTokens: 1200,
  });
  const { selections } = parseJson(raw);

  // Guard against a hallucinated URL slipping through — only keep selections that
  // match a real candidate we actually fetched.
  const validUrls = new Set(items.map((i) => i.url));
  return selections.filter((s) => validUrls.has(s.url));
}
