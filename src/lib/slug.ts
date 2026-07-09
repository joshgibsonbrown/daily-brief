// Shared between render-html.ts (which sets the anchor id on each <article>) and
// archive.ts (which stores the same anchor so "Related" links can deep-link to it).
// Both must be called with stories in the same order for anchors to line up.
export function slugify(headline: string, index: number): string {
  const base = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `story-${index}-${base}`;
}
