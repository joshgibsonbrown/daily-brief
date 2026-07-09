// Renders dev-output/latest-brief.json (produced by `npm run dev:curate -- --write`)
// into a previewable static HTML file. Pure function, no API calls — safe to re-run freely.
// Usage: npm run dev:render-html
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { renderBriefHtml, type RenderableStory } from "../src/pipeline/render-html.js";
import { getRelatedLinks } from "../src/pipeline/archive.js";
import type { Story } from "../src/types.js";

async function main() {
  const raw = await readFile("dev-output/latest-brief.json", "utf-8");
  const { date, stories } = JSON.parse(raw) as { date: string; stories: Story[] };

  const baseUrl = process.env.PUBLIC_BASE_URL ?? "";
  const renderable: RenderableStory[] = await Promise.all(
    stories.map(async (s) => ({ ...s, related: await getRelatedLinks(s, date, baseUrl) })),
  );

  const html = renderBriefHtml(renderable, date, baseUrl);
  await writeFile("dev-output/brief-preview.html", html);
  console.log(`Rendered ${stories.length} stories to dev-output/brief-preview.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
