import { putFile } from "../lib/github.js";

// Pushes the day's rendered pages to docs/ on the GitHub Pages branch. The same brief HTML
// goes to both docs/index.html (so the root URL always shows today's brief) and
// docs/briefs/{date}.html (a stable, permanent link — this is what email CTAs and
// "Related" links point to).
export async function publishBrief(briefHtml: string, archiveHtml: string, dateISO: string): Promise<void> {
  await putFile(`docs/briefs/${dateISO}.html`, briefHtml, `Publish brief for ${dateISO}`);
  await putFile("docs/index.html", briefHtml, `Update index to ${dateISO} brief`);
  await putFile("docs/archive.html", archiveHtml, `Update archive index`);
}

// robots.txt blocking all crawlers — the site isn't linked from anywhere, but this keeps
// it out of search results too. Not real access control, just hygiene for an "unlisted"
// public site.
const ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

export async function ensureRobotsTxt(): Promise<void> {
  await putFile("docs/robots.txt", ROBOTS_TXT, "Add robots.txt");
}
