import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROMPTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prompts");

// Loads a prompt template from src/prompts/<name>.md and substitutes {{key}} placeholders.
// Edit the .md files directly to change prompts — no TypeScript changes needed.
export async function loadPrompt(name: string, vars: Record<string, string>): Promise<string> {
  const raw = await readFile(path.join(PROMPTS_DIR, `${name}.md`), "utf-8");
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    raw,
  );
}
