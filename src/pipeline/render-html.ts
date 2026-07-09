import { BUCKETS } from "../config/buckets.js";
import { slugify } from "../lib/slug.js";
import type { Story } from "../types.js";

export interface RelatedLink {
  title: string;
  url: string;
}

// Related links come from the archive (Supabase), joined in at render time — not part of
// the core Story type since the writer never produces them.
export interface RenderableStory extends Story {
  related?: RelatedLink[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

function renderStory(story: RenderableStory, index: number): string {
  const anchorId = slugify(story.headline, index);
  const bucketLabel = BUCKETS.find((b) => b.id === story.bucket)?.label ?? story.bucket;

  const tags = story.tags ?? [];
  const tldrHtml = (story.tldr ?? []).map((t) => `<li>${escapeHtml(t)}</li>`).join("\n");
  const tagsHtml = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("\n");
  const sourcesHtml = (story.sources ?? [])
    .map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a></li>`)
    .join("\n");
  const relatedHtml =
    story.related && story.related.length > 0
      ? `<div class="related">
          <h4>Related</h4>
          <ul>
            ${story.related.map((r) => `<li><a href="${escapeHtml(r.url)}">${escapeHtml(r.title)}</a></li>`).join("\n")}
          </ul>
        </div>`
      : "";

  return `
  <article class="story" id="${anchorId}" data-bucket="${story.bucket}" data-tags="${escapeHtml(tags.join(","))}">
    <div class="story-meta">
      <span class="bucket-pill">${escapeHtml(bucketLabel)}</span>
      ${tagsHtml}
    </div>
    <h2>${escapeHtml(story.headline)}</h2>
    <ul class="tldr">
      ${tldrHtml}
    </ul>
    <div class="take">
      <h3>The take</h3>
      ${paragraphsHtml(story.take)}
    </div>
    <div class="other-side">
      <h3>The other side</h3>
      <p>${escapeHtml(story.otherSide)}</p>
    </div>
    <details class="say-more">
      <summary>Say more &rarr;</summary>
      <div class="say-more-content">
        ${paragraphsHtml(story.sayMore)}
        <div class="sources">
          <h4>Sources</h4>
          <ul>
            ${sourcesHtml}
          </ul>
        </div>
        ${relatedHtml}
      </div>
    </details>
  </article>`;
}

function formatDateLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// Renders the full day's brief as a single self-contained HTML page.
// Vanilla HTML/CSS/JS only — no frameworks, no external requests, dark mode by default.
export function renderBriefHtml(stories: RenderableStory[], dateISO: string): string {
  const bucketsPresent = BUCKETS.filter((b) => stories.some((s) => s.bucket === b.id));
  const allTags = Array.from(new Set(stories.flatMap((s) => s.tags ?? []))).sort();

  const tabButtons = [
    `<button class="tab active" data-bucket="all">All</button>`,
    ...bucketsPresent.map(
      (b) => `<button class="tab" data-bucket="${b.id}">${escapeHtml(b.label)}</button>`,
    ),
  ].join("\n");

  const tagButtons = [
    `<button class="tag-filter active" data-tag="all">All tags</button>`,
    ...allTags.map((t) => `<button class="tag-filter" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`),
  ].join("\n");

  const storiesHtml = stories.map((s, i) => renderStory(s, i)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Brief — ${escapeHtml(formatDateLabel(dateISO))}</title>
<style>
  :root {
    --bg: #0b0d10;
    --bg-elevated: #14171b;
    --border: #262a30;
    --text: #e8e8e6;
    --text-dim: #9aa0a6;
    --accent: #e0a458;
    --accent-dim: #7a5a30;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 680px; margin: 0 auto; padding: 16px 16px 64px; }
  header { padding: 16px 0 8px; }
  header h1 { font-size: 1.4rem; margin: 0 0 2px; }
  header .date { color: var(--text-dim); font-size: 0.9rem; }
  .tabs, .tag-filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 12px 0;
    -webkit-overflow-scrolling: touch;
  }
  .tabs { border-bottom: 1px solid var(--border); }
  .tab, .tag-filter {
    flex: 0 0 auto;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-dim);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .tab.active, .tag-filter.active {
    color: var(--bg);
    background: var(--accent);
    border-color: var(--accent);
  }
  .story {
    border-bottom: 1px solid var(--border);
    padding: 24px 0;
  }
  .story:last-child { border-bottom: none; }
  .story-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .bucket-pill {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
    background: rgba(224, 164, 88, 0.12);
    border-radius: 4px;
    padding: 2px 8px;
  }
  .tag {
    font-size: 0.7rem;
    color: var(--text-dim);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 8px;
  }
  .story h2 { font-size: 1.2rem; line-height: 1.35; margin: 0 0 12px; }
  .story h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin: 18px 0 8px; }
  .story h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin: 16px 0 6px; }
  .tldr { margin: 0 0 4px; padding-left: 20px; }
  .tldr li { margin-bottom: 6px; font-size: 0.95rem; }
  .take p, .other-side p, .say-more-content p { margin: 0 0 12px; font-size: 0.95rem; }
  .other-side { border-left: 2px solid var(--accent-dim); padding-left: 12px; }
  details.say-more { margin-top: 16px; }
  summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 0.9rem;
    font-weight: 600;
    list-style: none;
  }
  summary::-webkit-details-marker { display: none; }
  .say-more-content { margin-top: 12px; }
  .sources ul, .related ul { padding-left: 20px; margin: 0; }
  .sources a, .related a { color: var(--text-dim); font-size: 0.85rem; word-break: break-word; }
  .story.hidden { display: none; }
  footer { color: var(--text-dim); font-size: 0.8rem; text-align: center; padding-top: 24px; }
  footer a { color: var(--text-dim); }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Daily Brief</h1>
    <div class="date">${escapeHtml(formatDateLabel(dateISO))}</div>
  </header>

  <nav class="tabs">
    ${tabButtons}
  </nav>

  <nav class="tag-filters">
    ${tagButtons}
  </nav>

  <main id="stories">
    ${storiesHtml}
  </main>

  <footer>
    <a href="/archive.html">Archive</a>
  </footer>
</div>

<script>
  (function () {
    var currentBucket = "all";
    var currentTag = "all";
    var stories = Array.prototype.slice.call(document.querySelectorAll(".story"));

    function applyFilters() {
      stories.forEach(function (el) {
        var bucketMatch = currentBucket === "all" || el.dataset.bucket === currentBucket;
        var tags = (el.dataset.tags || "").split(",");
        var tagMatch = currentTag === "all" || tags.indexOf(currentTag) !== -1;
        el.classList.toggle("hidden", !(bucketMatch && tagMatch));
      });
    }

    document.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentBucket = btn.dataset.bucket;
        applyFilters();
      });
    });

    document.querySelectorAll(".tag-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tag-filter").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentTag = btn.dataset.tag;
        applyFilters();
      });
    });
  })();
</script>
</body>
</html>
`;
}
