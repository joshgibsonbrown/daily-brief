// Production entry point — this is what Railway's cron trigger runs every morning.
// Full pipeline: fetch -> curate -> write -> render -> archive -> publish -> email.
// On any failure, emails the error to MY_EMAIL instead of failing silently — the daily
// brief itself is the "it worked" signal, so an error email is the only monitoring needed.
import "dotenv/config";
import { fetchAllCandidates } from "./fetch-candidates.js";
import { curate } from "./curate.js";
import { writeStory } from "./write-story.js";
import { renderBriefHtml, type RenderableStory } from "./render-html.js";
import { renderArchivePage } from "./render-archive.js";
import { saveStories, getRelatedLinks, getArchiveIndex } from "./archive.js";
import { publishBrief } from "./publish.js";
import { sendDailyEmail } from "./send-email.js";
import { sendEmail } from "../lib/resend.js";
import type { Story } from "../types.js";

// Logs a safe fingerprint of each required env var (length + non-ASCII positions, never
// the value itself). Added after a corrupted paste in Railway's Variables UI put literal
// bullet characters (U+2022) inside a key — this makes runtime state visible in the logs
// so UI-vs-runtime mismatches can't hide.
function checkEnvVars(): void {
  const required = [
    "ANTHROPIC_API_KEY",
    "EXA_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "MY_EMAIL",
    "GITHUB_TOKEN",
    "GITHUB_REPO",
    "PUBLIC_BASE_URL",
  ];
  let corrupted = false;
  for (const name of required) {
    const value = process.env[name];
    if (!value) {
      console.log(`env check: ${name} — MISSING`);
      corrupted = true;
      continue;
    }
    const badIndexes: number[] = [];
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 0x20 || code > 0x7e) badIndexes.push(i);
    }
    if (badIndexes.length > 0) {
      console.log(
        `env check: ${name} — ${value.length} chars, CORRUPTED: non-ASCII at index ${badIndexes.slice(0, 5).join(", ")}${badIndexes.length > 5 ? ` (+${badIndexes.length - 5} more)` : ""} (char code ${value.charCodeAt(badIndexes[0])})`,
      );
      corrupted = true;
    } else {
      console.log(`env check: ${name} — ${value.length} chars, OK`);
    }
  }
  if (corrupted) {
    throw new Error(
      "One or more environment variables are missing or contain corrupted (non-ASCII) characters — see the env check lines above. Fix them in Railway's Variables tab and redeploy.",
    );
  }
}

function todayISO(): string {
  // Server runs in UTC; SGT is UTC+8 with no DST, so "today" in Singapore at the
  // 6:30am SGT run time is UTC date + 1 day relative to when the run kicks off in UTC
  // (22:30 UTC previous day = 06:30 SGT). Compute from the SGT wall-clock date directly.
  const sgtNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return sgtNow.toISOString().slice(0, 10);
}

async function runPipeline(): Promise<void> {
  checkEnvVars();

  const date = todayISO();
  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("PUBLIC_BASE_URL is not set");

  console.log(`[${date}] Fetching candidates...`);
  const candidates = await fetchAllCandidates();
  console.log(`[${date}] Found ${candidates.length} candidates.`);

  console.log(`[${date}] Curating...`);
  const selections = await curate(candidates);
  console.log(`[${date}] Selected ${selections.length} stories.`);

  console.log(`[${date}] Writing stories...`);
  const stories: Story[] = [];
  for (const s of selections) {
    const candidate = candidates.find((c) => c.url === s.url);
    if (!candidate) continue;
    stories.push(await writeStory(s.bucket, [candidate]));
  }
  if (stories.length === 0) throw new Error("No stories were written — nothing to publish.");

  console.log(`[${date}] Saving to archive...`);
  await saveStories(stories, date);

  console.log(`[${date}] Rendering pages...`);
  const renderable: RenderableStory[] = await Promise.all(
    stories.map(async (s) => ({ ...s, related: await getRelatedLinks(s, date, baseUrl) })),
  );
  const briefHtml = renderBriefHtml(renderable, date, baseUrl);
  const archiveDays = await getArchiveIndex();
  const archiveHtml = renderArchivePage(archiveDays, baseUrl);

  console.log(`[${date}] Publishing to GitHub Pages...`);
  await publishBrief(briefHtml, archiveHtml, date);

  console.log(`[${date}] Sending email...`);
  await sendDailyEmail(stories, date, baseUrl);

  console.log(`[${date}] Done.`);
}

async function main() {
  try {
    await runPipeline();
  } catch (err) {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error(message);

    const to = process.env.MY_EMAIL;
    if (to) {
      try {
        await sendEmail({
          to,
          subject: "Daily Brief — run failed",
          html: `<pre style="white-space:pre-wrap;font-family:monospace;">${message.replace(/</g, "&lt;")}</pre>`,
        });
      } catch (emailErr) {
        console.error("Also failed to send the failure notification email:", emailErr);
      }
    }
    process.exit(1);
  }
}

main();
