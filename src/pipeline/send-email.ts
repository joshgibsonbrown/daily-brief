import { complete } from "../lib/anthropic.js";
import { loadPrompt } from "../lib/prompts.js";
import { sendEmail } from "../lib/resend.js";
import { MODELS } from "../config/models.js";
import { renderEmailHtml } from "./render-email.js";
import type { Story } from "../types.js";

function formatDayDate(dateISO: string): { day: string; date: string } {
  const d = new Date(`${dateISO}T00:00:00`);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "long" }),
    date: d.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  };
}

async function generateSubjectHook(stories: Story[]): Promise<string> {
  const summary = stories
    .map((s) => `[${s.bucket}] ${s.headline}\nThe take: ${s.take.slice(0, 500)}`)
    .join("\n\n");
  const prompt = await loadPrompt("email-hook", { stories_summary: summary });
  const hook = await complete({
    model: MODELS.writer,
    system: "You write sharp, specific email subject lines. Follow the instructions exactly.",
    user: prompt,
    maxTokens: 60,
  });
  return hook.trim().replace(/^["']|["']$/g, "");
}

// Generates and sends the day's teaser email. `baseUrl` is the hosted brief site's root
// (e.g. https://yourname.github.io/daily-brief) — CTAs and the footer link point there.
export async function sendDailyEmail(stories: Story[], dateISO: string, baseUrl: string): Promise<void> {
  const to = process.env.MY_EMAIL;
  if (!to) throw new Error("MY_EMAIL is not set");

  const hook = await generateSubjectHook(stories);
  const { day, date } = formatDayDate(dateISO);
  const subject = `Daily Brief — ${day}, ${date} — ${hook}`;

  const html = renderEmailHtml(stories, dateISO, baseUrl);

  await sendEmail({ to, subject, html });
}
