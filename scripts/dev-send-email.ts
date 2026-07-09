// Sends today's teaser email using whatever is saved in dev-output/latest-brief.json,
// to MY_EMAIL. Uses PUBLIC_BASE_URL for links — a placeholder until GitHub Pages is live,
// so links in the test email won't resolve to anything real yet. That's expected.
// Usage: npm run dev:send-email
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { sendDailyEmail } from "../src/pipeline/send-email.js";
import type { Story } from "../src/types.js";

async function main() {
  const raw = await readFile("dev-output/latest-brief.json", "utf-8");
  const { date, stories } = JSON.parse(raw) as { date: string; stories: Story[] };
  const baseUrl = process.env.PUBLIC_BASE_URL ?? "";

  console.log(`Sending ${stories.length}-story brief for ${date} to ${process.env.MY_EMAIL}...`);
  await sendDailyEmail(stories, date, baseUrl);
  console.log("Sent. Check your inbox.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
