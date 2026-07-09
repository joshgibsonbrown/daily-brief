// One-time setup (robots.txt + enabling Pages) plus a real publish of whatever is saved
// in dev-output/latest-brief.json, using the live archive for the /archive page.
// Usage: npm run dev:publish
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { renderBriefHtml, type RenderableStory } from "../src/pipeline/render-html.js";
import { renderArchivePage } from "../src/pipeline/render-archive.js";
import { getRelatedLinks, getArchiveIndex } from "../src/pipeline/archive.js";
import { publishBrief, ensureRobotsTxt } from "../src/pipeline/publish.js";
import { enablePagesFromDocsFolder } from "../src/lib/github.js";
import type { Story } from "../src/types.js";

async function main() {
  console.log("Ensuring robots.txt and GitHub Pages are set up...");
  await ensureRobotsTxt();
  await enablePagesFromDocsFolder();

  const raw = await readFile("dev-output/latest-brief.json", "utf-8");
  const { date, stories } = JSON.parse(raw) as { date: string; stories: Story[] };

  console.log(`Rendering brief for ${date}...`);
  const renderable: RenderableStory[] = await Promise.all(
    stories.map(async (s) => ({ ...s, related: await getRelatedLinks(s, date) })),
  );
  const briefHtml = renderBriefHtml(renderable, date);

  console.log("Rendering archive page...");
  const archiveDays = await getArchiveIndex();
  const archiveHtml = renderArchivePage(archiveDays);

  console.log("Publishing to GitHub Pages...");
  await publishBrief(briefHtml, archiveHtml, date);

  console.log(`Done. Should be live shortly at ${process.env.PUBLIC_BASE_URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
