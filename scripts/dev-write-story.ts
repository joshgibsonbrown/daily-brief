// Local dev CLI — no side effects (no Supabase, no email, no publish).
// Usage: npm run dev:write-story -- <bucket-id> [--top N]
//   e.g. npm run dev:write-story -- geopolitics
//   e.g. npm run dev:write-story -- tech-ai --top 3
import "dotenv/config";
import { fetchCandidates } from "../src/pipeline/fetch-candidates.js";
import { writeStory } from "../src/pipeline/write-story.js";
import { BUCKETS, type Bucket } from "../src/config/buckets.js";
import type { Story } from "../src/types.js";

function printStory(story: Story) {
  const bucketLabel = BUCKETS.find((b) => b.id === story.bucket)?.label ?? story.bucket;
  console.log("\n" + "=".repeat(70));
  console.log(`[${bucketLabel}]`);
  console.log(story.headline);
  console.log("\nTL;DR");
  for (const bullet of story.tldr) console.log(`- ${bullet}`);
  console.log("\nThe take");
  console.log(story.take);
  console.log("\nThe other side.", story.otherSide);
  console.log("\n[Say more →]");
  console.log(story.sayMore);
  console.log("\nTags:", story.tags.join(", "));
  console.log("\nSources:");
  for (const s of story.sources) console.log(`- ${s.title} (${s.url})`);
  console.log("=".repeat(70) + "\n");
}

async function main() {
  const [bucketArg, ...rest] = process.argv.slice(2);
  const topFlagIdx = rest.indexOf("--top");
  const topN = topFlagIdx >= 0 ? Number(rest[topFlagIdx + 1]) : 1;

  const validIds = BUCKETS.map((b) => b.id);
  if (!bucketArg || !validIds.includes(bucketArg as Bucket)) {
    console.error(`Usage: npm run dev:write-story -- <bucket> [--top N]`);
    console.error(`Buckets: ${validIds.join(", ")}`);
    process.exit(1);
  }
  const bucket = bucketArg as Bucket;

  console.log(`Fetching candidates for "${bucket}" from Exa...`);
  const candidates = await fetchCandidates(bucket);
  console.log(`Found ${candidates.length} candidates. Using top ${topN} by relevance order.`);
  if (candidates.length === 0) {
    console.error("No candidates found — try again later or widen the seed queries in src/config/buckets.ts");
    process.exit(1);
  }

  console.log("Writing story (Opus for 'The take', Sonnet for the rest)...");
  const story = await writeStory(bucket, candidates.slice(0, topN));
  printStory(story);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
