import { slugify } from "../lib/slug.js";
import type { Story } from "../types.js";

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

function storyBlock(story: Story, index: number, dateISO: string, baseUrl: string): string {
  const anchor = slugify(story.headline, index);
  const url = `${baseUrl}/briefs/${dateISO}.html#${anchor}`;
  const tldrHtml = (story.tldr ?? [])
    .map(
      (t) =>
        `<tr><td style="padding:0 0 8px;color:#c7c9cc;font-size:14px;line-height:1.5;" valign="top">&bull;&nbsp;</td><td style="padding:0 0 8px;color:#c7c9cc;font-size:14px;line-height:1.5;">${escapeHtml(t)}</td></tr>`,
    )
    .join("\n");

  return `
  <tr>
    <td style="padding:28px 0;border-bottom:1px solid #262a30;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:17px;font-weight:700;line-height:1.35;color:#e8e8e6;padding:0 0 12px;">
            ${escapeHtml(story.headline)}
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${tldrHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 0;">
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#e0a458;color:#0b0d10;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:6px;">Read the full take &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// Plain HTML email, mobile-first, dark-mode friendly, table-based layout for broad
// email-client compatibility. Headlines + TLDR only — the CTA sends the reader to the
// full story on the hosted page. No JS (email clients strip it anyway).
export function renderEmailHtml(stories: Story[], dateISO: string, baseUrl: string): string {
  const storiesHtml = stories.map((s, i) => storyBlock(s, i, dateISO, baseUrl)).join("\n");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Daily Brief</title>
</head>
<body style="margin:0;padding:0;background:#0b0d10;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d10;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 20px;">
              <div style="font-size:20px;font-weight:700;color:#e8e8e6;">Daily Brief</div>
              <div style="font-size:13px;color:#9aa0a6;margin-top:2px;">${escapeHtml(formatDateLabel(dateISO))}</div>
            </td>
          </tr>
          ${storiesHtml}
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <a href="${escapeHtml(baseUrl)}/briefs/${dateISO}.html" style="color:#9aa0a6;font-size:13px;text-decoration:underline;">View the full brief &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
