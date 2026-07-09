import { BUCKETS } from "../config/buckets.js";
import type { ArchiveDay } from "./archive.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// Renders the /archive page — a simple reverse-chronological list of every past brief,
// each story linking straight to its anchor on that day's page. Same vanilla, dark-mode,
// mobile-first approach as the brief page itself — no framework, no external requests.
export function renderArchivePage(days: ArchiveDay[]): string {
  const daysHtml = days
    .map((day) => {
      const storiesHtml = day.stories
        .map((s) => {
          const bucketLabel = BUCKETS.find((b) => b.id === s.bucket)?.label ?? s.bucket;
          return `<li><span class="bucket-pill">${escapeHtml(bucketLabel)}</span> <a href="/briefs/${day.date}.html#${escapeHtml(s.anchor)}">${escapeHtml(s.headline)}</a></li>`;
        })
        .join("\n");
      return `
      <section class="day">
        <h2><a href="/briefs/${day.date}.html">${escapeHtml(formatDateLabel(day.date))}</a></h2>
        <ul>
          ${storiesHtml}
        </ul>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Brief — Archive</title>
<style>
  :root {
    --bg: #0b0d10;
    --border: #262a30;
    --text: #e8e8e6;
    --text-dim: #9aa0a6;
    --accent: #e0a458;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
  }
  .container { max-width: 680px; margin: 0 auto; padding: 16px 16px 64px; }
  header h1 { font-size: 1.4rem; margin: 16px 0 4px; }
  header a { color: var(--text-dim); font-size: 0.85rem; }
  .day { border-bottom: 1px solid var(--border); padding: 20px 0; }
  .day:last-child { border-bottom: none; }
  .day h2 { font-size: 1rem; margin: 0 0 10px; }
  .day h2 a { color: var(--text); text-decoration: none; }
  .day ul { list-style: none; margin: 0; padding: 0; }
  .day li { margin-bottom: 10px; font-size: 0.9rem; }
  .day a { color: var(--text-dim); text-decoration: none; }
  .day li a:hover { color: var(--text); }
  .bucket-pill {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
    background: rgba(224, 164, 88, 0.12);
    border-radius: 4px;
    padding: 2px 6px;
    margin-right: 6px;
  }
  .empty { color: var(--text-dim); padding: 24px 0; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Archive</h1>
    <a href="/">&larr; Back to today's brief</a>
  </header>
  ${days.length > 0 ? daysHtml : `<div class="empty">No briefs archived yet.</div>`}
</div>
</body>
</html>
`;
}
