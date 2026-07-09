// Renders the /archive page from whatever is currently in Supabase.
// Usage: npm run dev:render-archive
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { getArchiveIndex } from "../src/pipeline/archive.js";
import { renderArchivePage } from "../src/pipeline/render-archive.js";

async function main() {
  const days = await getArchiveIndex();
  const html = renderArchivePage(days, process.env.PUBLIC_BASE_URL ?? "");
  await writeFile("dev-output/archive-preview.html", html);
  console.log(`Rendered ${days.length} day(s) to dev-output/archive-preview.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
