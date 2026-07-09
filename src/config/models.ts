// Single source of truth for model IDs. Never hardcode a model string elsewhere.
export const MODELS = {
  // Standard writing: headline, TLDR, "The other side", "Say more" expansion, tags.
  writer: "claude-sonnet-4-6",
  // "The take" only — this is the section that needs the strongest reasoning.
  analyst: "claude-opus-4-8",
} as const;
