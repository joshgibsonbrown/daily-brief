const API_BASE = "https://api.github.com";

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
  };
}

function repoSlug(): string {
  const repo = process.env.GITHUB_REPO;
  if (!repo) throw new Error("GITHUB_REPO is not set (expected \"owner/repo\")");
  return repo;
}

async function getFileSha(path: string): Promise<string | undefined> {
  const res = await fetch(`${API_BASE}/repos/${repoSlug()}/contents/${path}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub getFileSha failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

// Creates or updates a single file via the Contents API. Railway's filesystem is
// ephemeral between runs, so this is simpler and more reliable than shelling out to git.
export async function putFile(path: string, content: string, message: string): Promise<void> {
  const sha = await getFileSha(path);

  const res = await fetch(`${API_BASE}/repos/${repoSlug()}/contents/${path}`, {
    method: "PUT",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha, // omitted (undefined) on create, required on update
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub putFile failed for ${path} (${res.status}): ${await res.text()}`);
  }
}

// One-time setup call — enables GitHub Pages serving from /docs on main. Safe to call
// again (no-ops if already configured the same way); GitHub returns 409 if Pages is
// already enabled, which we treat as success.
export async function enablePagesFromDocsFolder(): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/${repoSlug()}/pages`, {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ source: { branch: "main", path: "/docs" } }),
  });

  if (res.status === 409) return; // already enabled
  if (!res.ok) {
    throw new Error(`GitHub enablePages failed (${res.status}): ${await res.text()}`);
  }
}
