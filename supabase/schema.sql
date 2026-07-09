-- Daily Brief archive schema. Run this once in the Supabase SQL Editor.
-- One row per story (not per brief) — brief_date groups stories into a day's brief,
-- and lets "Related" queries search across all prior stories by tag/bucket overlap.

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null,
  bucket text not null,
  headline text not null,
  tldr text[] not null,
  take text not null,
  other_side text not null,
  say_more text not null,
  tags text[] not null default '{}',
  sources jsonb not null default '[]',
  -- Matches the anchor id set on the story's <article> in the rendered HTML page
  -- (see src/lib/slug.ts) — lets "Related" links deep-link straight to the story.
  anchor text not null,
  created_at timestamptz not null default now()
);

create index if not exists stories_brief_date_idx on stories (brief_date desc);
create index if not exists stories_tags_idx on stories using gin (tags);
create index if not exists stories_bucket_idx on stories (bucket);

-- Locked down by default: RLS is on and no policies are defined, so only requests
-- authenticated with the service role key (used by the Railway backend) can read or
-- write. The anon key — which would be exposed if it ever leaked into client-side code —
-- gets nothing.
alter table stories enable row level security;
