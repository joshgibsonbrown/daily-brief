// One-off test of the archive write + related-links read against the real Supabase instance,
// using whatever brief is currently saved in dev-output/latest-brief.json.
// Usage: npm run dev:archive-test
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { saveStories, getRelatedLinks } from "../src/pipeline/archive.js";
import type { Story } from "../src/types.js";

async function main() {
  const raw = await readFile("dev-output/latest-brief.json", "utf-8");
  const { date, stories } = JSON.parse(raw) as { date: string; stories: Story[] };

  console.log(`Saving ${stories.length} stories for ${date} to the archive...`);
  await saveStories(stories, date);
  console.log("Saved.");

  const testStory = stories[0];
  console.log(`\nLooking up related links for: "${testStory.headline}" (should be empty — this is the first entry)`);
  const related = await getRelatedLinks(testStory, date, process.env.PUBLIC_BASE_URL ?? "");
  console.log(related.length === 0 ? "(none found, as expected for a fresh archive)" : related);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
