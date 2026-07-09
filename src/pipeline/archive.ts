import { restInsert, restDelete, restSelect } from "../lib/supabase.js";
import { slugify } from "../lib/slug.js";
import type { Story } from "../types.js";
import type { RelatedLink } from "./render-html.js";

interface StoryRow {
  brief_date: string;
  bucket: string;
  headline: string;
  tldr: string[];
  take: string;
  other_side: string;
  say_more: string;
  tags: string[];
  sources: { title: string; url: string }[];
  anchor: string;
}

// Saves the day's stories to the archive. Call once per day, after the brief is finalized.
// `stories` must be in the same order passed to renderBriefHtml — anchors are derived from
// (headline, index) identically in both places (see src/lib/slug.ts) so "Related" links
// resolve to the right in-page anchor.
// Idempotent per date: re-running the same day (manual retry, crash re-run) replaces that
// day's rows instead of stacking duplicates.
export async function saveStories(stories: Story[], briefDate: string): Promise<void> {
  await restDelete("stories", `brief_date=eq.${briefDate}`);

  const rows: StoryRow[] = stories.map((s, i) => ({
    brief_date: briefDate,
    bucket: s.bucket,
    headline: s.headline,
    tldr: s.tldr ?? [],
    take: s.take,
    other_side: s.otherSide,
    say_more: s.sayMore,
    tags: s.tags ?? [],
    sources: s.sources ?? [],
    anchor: slugify(s.headline, i),
  }));

  await restInsert("stories", rows);
}

// PostgREST's `or=` filter is a raw grammar string, so we strip characters that would
// break it out of tags before building one — tags are short model-generated words, this
// is just a defensive floor, not expected to trigger in practice.
function sanitizeTag(tag: string): string {
  return tag.replace(/[{}(),]/g, "").trim();
}

// Finds prior stories that share a tag or bucket with the given story, most recent first.
// Powers the "Related" links in the "Say more" section. Returns [] if the archive doesn't
// have anything relevant yet (e.g. early days of the project) — that's expected, not an error.
// URLs are absolute (baseUrl-prefixed) — see the note on renderBriefHtml for why.
export async function getRelatedLinks(story: Story, briefDate: string, baseUrl: string, limit = 3): Promise<RelatedLink[]> {
  const tags = (story.tags ?? []).map(sanitizeTag).filter(Boolean);

  const conditions = [`bucket.eq.${story.bucket}`];
  if (tags.length > 0) conditions.push(`tags.ov.{${tags.join(",")}}`);
  const orFilter = encodeURIComponent(`(${conditions.join(",")})`);

  const query =
    `select=headline,brief_date,anchor` +
    `&brief_date=lt.${briefDate}` +
    `&or=${orFilter}` +
    `&order=brief_date.desc` +
    `&limit=${limit}`;

  const data = await restSelect<{ headline: string; brief_date: string; anchor: string }>("stories", query);

  return data.map((row) => ({
    title: row.headline,
    url: `${baseUrl}/briefs/${row.brief_date}.html#${row.anchor}`,
  }));
}

export interface ArchiveDay {
  date: string;
  stories: { headline: string; bucket: string; anchor: string }[];
}

// Full archive index, newest day first — powers the /archive page.
export async function getArchiveIndex(): Promise<ArchiveDay[]> {
  const data = await restSelect<{ brief_date: string; headline: string; bucket: string; anchor: string }>(
    "stories",
    "select=brief_date,headline,bucket,anchor&order=brief_date.desc,created_at.asc",
  );

  const byDate = new Map<string, ArchiveDay["stories"]>();
  for (const row of data) {
    const list = byDate.get(row.brief_date) ?? [];
    list.push({ headline: row.headline, bucket: row.bucket, anchor: row.anchor });
    byDate.set(row.brief_date, list);
  }

  return Array.from(byDate.entries()).map(([date, stories]) => ({ date, stories }));
}
