export type Bucket =
  | "private-markets"
  | "iconiq-portfolio"
  | "wealth-planning"
  | "tech-ai"
  | "financial-markets"
  | "geopolitics"
  | "wildcard";

// Order matters — this is priority order for curation, not just display.
// `weight` is a soft bias for curation (1-5, higher = more important) — see prompts/curate.md.
// It nudges which bucket wins on close calls; it never forces a pick or guarantees a slot.
export const BUCKETS: {
  id: Bucket;
  label: string;
  weight: number;
  framing: string;
  // Seed queries handed to Exa. Edit these to steer what gets found — no code changes needed elsewhere.
  seedQueries: string[];
}[] = [
  {
    id: "private-markets",
    label: "Private Markets",
    weight: 5,
    framing:
      "PE fundraising, secondaries, continuation vehicles, GP dynamics, all-star manager moves. Invest Like the Best lens.",
    seedQueries: [
      "private equity fundraising secondaries",
      "continuation vehicle GP stakes",
      "private markets manager fund close",
    ],
  },
  {
    id: "iconiq-portfolio",
    label: "ICONIQ Portfolio Companies",
    weight: 5,
    framing:
      "News on companies in the ICONIQ Strategic Partners VII portfolio — funding rounds, leadership changes, product launches, M&A, competitive moves. Only worth a story when something material actually happened; most days most of these companies won't have news.",
    // Sourced from the ISP VII (Feb 2026) investor letter's portfolio valuation table — 54 companies,
    // batched into ~7 companies/query (not one query per company) to stay well under Exa's rate limit
    // and keep this bucket's daily call volume in line with the others. Update this list when a new
    // letter adds/removes positions — no other code needs to change.
    seedQueries: [
      "Anthropic OR OpenAI OR ElevenLabs OR Glean OR Writer OR Sierra OR OpenEvidence startup news",
      "Stripe OR Ramp OR Revolut OR Monzo OR Adyen OR \"Lead Bank\" OR Swap startup fintech news",
      "Databricks OR Clickhouse OR Figma OR Pigment OR BambooHR OR FloQast OR UnifyApps OR Rillet startup news",
      "Canva OR DeepL OR Quince OR Oura OR Legora OR Restaurant365 OR Braintrust startup news",
      "AcuityMD OR Altruist OR Causaly OR Pontera OR Assured OR \"CCC Intelligent Solutions\" startup news",
      "Prompt OR Tennr OR Virtru OR DriveCentric OR \"Incident IQ\" OR Groww startup news",
      "\"Rain\" fintech startup OR \"Coast\" fintech startup OR \"DX\" startup OR \"Atomix Data\" startup OR \"Nevis\" startup OR \"Outtake\" startup OR \"Pepper\" startup OR \"ST Labs\" startup OR \"Tiny Fish\" startup OR \"Whirl AI\" startup OR \"Grotto\" startup news",
    ],
  },
  {
    id: "wealth-planning",
    label: "Family Office & Wealth Planning",
    weight: 4,
    framing:
      "UHNW/family office structuring, generational wealth transfer, tax and regulatory shifts affecting private capital, family office investment trends.",
    seedQueries: [
      "family office investment trend",
      "UHNW wealth planning tax structuring",
      "generational wealth transfer family office",
    ],
  },
  {
    id: "tech-ai",
    label: "Tech & AI",
    weight: 4,
    framing:
      "Frontier labs, chip/infrastructure, enterprise adoption, agentic tools. A16Z-style framing plus All In skepticism as counterweight.",
    seedQueries: [
      "AI frontier lab model release enterprise adoption",
      "AI chip infrastructure buildout",
      "agentic AI tools enterprise",
      "AI labs competition open weight models",
    ],
  },
  {
    id: "financial-markets",
    label: "Financial Markets & Economic News",
    weight: 3,
    framing:
      "Macro, rates, positioning, sector rotation, economic data. Prof G Markets / Unhedged sensibility.",
    seedQueries: [
      "Federal Reserve rates market positioning",
      "sector rotation equity markets",
      "macro outlook public markets",
    ],
  },
  {
    id: "geopolitics",
    label: "Geopolitics",
    weight: 1,
    framing:
      "US foreign policy, China, Middle East, Europe. High-level structural view, not tactical news. Lowest editorial priority — only include when the story is genuinely exceptional.",
    seedQueries: [
      "US foreign policy strategic shift",
      "China Taiwan geopolitics analysis",
      "Middle East diplomacy deal",
      "Europe defense policy geopolitics",
    ],
  },
  {
    id: "wildcard",
    label: "Wildcard",
    weight: 1,
    framing:
      "One story per day from anywhere — culture, sports/geopolitics crossover, off-consensus science. Surprise and delight. Cap at 1 per day even when included.",
    seedQueries: [
      "off consensus science discovery",
      "sports geopolitics crossover story",
      "culture trend structural analysis",
    ],
  },
];
