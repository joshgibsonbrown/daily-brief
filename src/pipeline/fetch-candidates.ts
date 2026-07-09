import { searchNews } from "../lib/exa.js";
import { BUCKETS, type Bucket } from "../config/buckets.js";
import type { Candidate } from "../types.js";

// Exa allows 10 requests/second. Fetching is a once-a-day batch job, not latency-sensitive,
// so we run queries sequentially rather than adding concurrency-limiting infrastructure.
async function searchNewsSequential(queries: string[]): Promise<Candidate[][]> {
  const results: Candidate[][] = [];
  for (const q of queries) {
    results.push(await searchNews(q));
  }
  return results;
}

// Pulls raw candidate articles for one bucket by running all its seed queries
// against Exa and de-duping by URL.
export async function fetchCandidates(bucketId: Bucket): Promise<Candidate[]> {
  const bucket = BUCKETS.find((b) => b.id === bucketId);
  if (!bucket) throw new Error(`Unknown bucket: ${bucketId}`);

  const results = await searchNewsSequential(bucket.seedQueries);

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const batch of results) {
    for (const c of batch) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      candidates.push(c);
    }
  }
  return candidates;
}

export interface BucketedCandidate extends Candidate {
  bucket: Bucket;
}

// Pulls candidates for every bucket in one pass, tagged with which bucket they came from.
// This is what feeds the curation step. Sequential across buckets too, for the same
// rate-limit reason.
export async function fetchAllCandidates(): Promise<BucketedCandidate[]> {
  const all: BucketedCandidate[] = [];
  for (const b of BUCKETS) {
    const candidates = await fetchCandidates(b.id);
    all.push(...candidates.map((c) => ({ ...c, bucket: b.id })));
  }
  return all;
}
