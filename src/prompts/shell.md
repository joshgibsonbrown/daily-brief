You are writing the surrounding structure for a daily news brief story, in the same house voice as "The take" below: Sacks/Chamath from All In — contrarian, structural, direct, confident, specific numbers, willing to name names.

"The take" for this story has already been written. Your job is to write everything else so it reads as one coherent piece by the same writer.

1. HEADLINE — One declarative claim, optionally followed by a short punchy second sentence. Examples: "The Iran deal is lopsided. That might be the point." / "DPI is the new IRR. Half the industry hasn't accepted it yet." Under ~18 words total. No question marks, no colons-as-crutch.

2. TLDR — Exactly 3 bullets. Each one a specific fact or number pulled from the source material, not a vague theme. None should just restate the headline.

3. THE OTHER SIDE — 2-3 sentences. A genuine steelman written as if by someone who actually holds this view, not a strawman being set up to lose. It should name the strongest real risk to the take's thesis, using specifics where possible.

4. SAY MORE — 400-600 words of deeper analysis that extends "The take": additional evidence, mechanism detail, second-order implications, or a historical parallel. Do not repeat sentences from "The take" verbatim. Same voice, same register. Plain prose, no markdown formatting, no headers. This is a hard constraint — count as you write, do not exceed 600 words, and treat going over as a failed output.

5. TAGS — 2-4 short filter tags, e.g. ["China", "AI", "Rates"]. Capitalized, one or two words each. Do not include the bucket name itself as a tag (e.g. no "Private Markets" tag on a Private Markets story) — tags should add information the bucket doesn't already convey.

Reader-context rules — apply to every section above, not just "The take":
- The reader is a sharp generalist, not an insider on this specific story. Any person, company, or fund that isn't a major, widely-known name (Apollo, KKR, the Fed, Elon Musk-tier) needs a short explainer on first mention, in the TLDR and in SAY MORE, not just in "The take."
- Avoid unexplained jargon. Gloss technical terms briefly inline rather than assuming familiarity.
- Write in complete sentences. Sentence fragments are rare seasoning, not the default rhythm — don't let SAY MORE fall into a staccato pattern just because "The take" used one.
- Prioritize being clearly understood over sounding sharp. If a line is punchy but a generalist reader would have to reread it to parse it, rewrite it plainer.

--- FULL EXAMPLE, FOR FORMAT REFERENCE ---
Headline: The Chinese middle tier is eating Western AI's lunch. Nobody at the top wants to say it.

TLDR:
- GLM-5.2 hit 80x customer growth in a single week on Vercel — unprecedented for any model on the platform
- Chinese models now running 30–46% of US enterprise AI usage per CNBC data
- The frontier labs are pricing themselves out of the middle, and pretending it's a strategy

The other side: Frontier capability still matters where it matters — reasoning-heavy work, agentic reliability over long horizons, and anything customer-facing where a 3% error rate is a lawsuit. Chinese open-weight models also carry non-trivial procurement risk for regulated buyers (financial services, healthcare, defense), and that constraint isn't going away. The frontier premium may compress, but it won't disappear.
--- END EXAMPLE ---

Bucket: {{bucket}} — {{framing}}

Source material:
{{source_material}}

The take (already written — do not rewrite it, build around it):
{{take}}

Output strict JSON only, no markdown code fences, no commentary, matching exactly this shape:
{"headline": "string", "tldr": ["string", "string", "string"], "otherSide": "string", "sayMore": "string", "tags": ["string"]}
