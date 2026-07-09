import { complete } from "../lib/anthropic.js";
import { loadPrompt } from "../lib/prompts.js";
import { MODELS } from "../config/models.js";
import { BUCKETS, type Bucket } from "../config/buckets.js";
import type { Candidate, Story } from "../types.js";

const SYSTEM = "You are a professional analyst writing for a daily private news brief. Follow the instructions exactly.";

interface Shell {
  headline: string;
  tldr: [string, string, string];
  otherSide: string;
  sayMore: string;
  tags: string[];
}

function parseShellJson(raw: string): Shell {
  // Strip stray markdown fences in case the model adds them despite instructions.
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");
  const parsed = JSON.parse(cleaned) as Partial<Shell>;

  // Defend against the model occasionally dropping a field — a missing tags/tldr array
  // shouldn't take down the whole pipeline over a cosmetic field.
  return {
    headline: parsed.headline ?? "(missing headline)",
    tldr: parsed.tldr ?? ["", "", ""],
    otherSide: parsed.otherSide ?? "",
    sayMore: parsed.sayMore ?? "",
    tags: parsed.tags ?? [],
  };
}

// Turns one or more candidate articles (same bucket) into a fully formatted Story.
// This is the isolated unit we iterate voice against before building anything downstream.
export async function writeStory(bucketId: Bucket, candidates: Candidate[]): Promise<Story> {
  const bucket = BUCKETS.find((b) => b.id === bucketId);
  if (!bucket) throw new Error(`Unknown bucket: ${bucketId}`);
  if (candidates.length === 0) throw new Error("writeStory needs at least one candidate");

  const sourceMaterial = candidates
    .map((c) => `SOURCE: ${c.title} (${c.url})\n${c.content}`)
    .join("\n\n---\n\n");

  const takePrompt = await loadPrompt("take", {
    bucket: bucket.label,
    framing: bucket.framing,
    source_material: sourceMaterial,
  });
  const take = await complete({ model: MODELS.analyst, system: SYSTEM, user: takePrompt, maxTokens: 1100 });

  const shellPrompt = await loadPrompt("shell", {
    bucket: bucket.label,
    framing: bucket.framing,
    source_material: sourceMaterial,
    take,
  });
  const shellRaw = await complete({ model: MODELS.writer, system: SYSTEM, user: shellPrompt, maxTokens: 1700 });
  const shell = parseShellJson(shellRaw);

  return {
    bucket: bucketId,
    headline: shell.headline,
    tldr: shell.tldr,
    take: take.trim(),
    otherSide: shell.otherSide,
    sayMore: shell.sayMore,
    tags: shell.tags,
    sources: candidates.map((c) => ({ title: c.title, url: c.url })),
  };
}
