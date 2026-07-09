import type { Bucket } from "./config/buckets.js";

export interface Candidate {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
}

export interface Story {
  bucket: Bucket;
  headline: string; // declarative claim + short punchy second line, e.g. sample format
  tldr: string[]; // 3 bullets
  take: string; // "The take" — multi-paragraph, written by the analyst model
  otherSide: string; // "The other side" — 2-3 sentence steelman
  sayMore: string; // 400-600 word deeper analysis for the expandable section
  tags: string[]; // e.g. ["China", "AI", "Rates"]
  sources: { title: string; url: string }[];
}
