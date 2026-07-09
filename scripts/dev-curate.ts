// Local dev CLI for the curation step only — fetches candidates across all buckets
// and shows what the editor would pick, WITHOUT writing full stories (cheap to iterate on).
// Usage: npm run dev:curate
//   Add --write to also run the full write-story pipeline on the picks (expensive, use sparingly).
//   With --write, the resulting stories are also saved to dev-output/latest-brief.json so
//   downstream steps (like the HTML renderer) can be developed/tested without re-spending on APIs.
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchAllCandidates } from "../src/pipeline/fetch-candidates.js";
import { curate } from "../src/pipeline/curate.js";
import { writeStory } from "../src/pipeline/write-story.js";
import { BUCKETS } from "../src/config/buckets.js";
import type { Story } from "../src/types.js";

async function main() {
  const shouldWrite = process.argv.includes("--write");

  console.log("Fetching candidates for all buckets from Exa...");
  const candidates = await fetchAllCandidates();
  console.log(`Found ${candidates.length} candidates total.`);

  console.log("Curating today's picks...");
  const selections = await curate(candidates);

  console.log(`\nPicked ${selections.length} stories:\n`);
  for (const s of selections) {
    const label = BUCKETS.find((b) => b.id === s.bucket)?.label ?? s.bucket;
    console.log(`[${label}] ${s.url}`);
    console.log(`  reason: ${s.reason}\n`);
  }

  if (!shouldWrite) return;

  console.log("\nWriting full stories for the picks...\n");
  const stories: Story[] = [];
  for (const s of selections) {
    const candidate = candidates.find((c) => c.url === s.url);
    if (!candidate) continue;
    const story = await writeStory(s.bucket, [candidate]);
    stories.push(story);
    console.log("=".repeat(70));
    console.log(`[${s.bucket}] ${story.headline}`);
    console.log(story.tldr.map((t) => `- ${t}`).join("\n"));
    console.log("\nThe take\n" + story.take);
    console.log("\nThe other side.", story.otherSide);
    console.log("=".repeat(70) + "\n");
  }

  await mkdir("dev-output", { recursive: true });
  const outPath = "dev-output/latest-brief.json";
  await writeFile(outPath, JSON.stringify({ date: new Date().toISOString().slice(0, 10), stories }, null, 2));
  console.log(`Saved ${stories.length} stories to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
