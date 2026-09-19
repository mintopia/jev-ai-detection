import type { ParsedSource } from "./parseUrl.js";

function buildApiUrl(source: ParsedSource): string {
  const base = `https://api.github.com/repos/${source.owner}/${source.repo}`;
  switch (source.kind) {
    case "issue":
      return `${base}/issues/${source.number}`;
    case "pull":
      return `${base}/pulls/${source.number}`;
    case "issue-comment":
      return `${base}/issues/comments/${source.commentId}`;
    case "pull-review-comment":
      return `${base}/pulls/comments/${source.commentId}`;
  }
}

export async function fetchSourceText(source: ParsedSource): Promise<string> {
  const apiUrl = buildApiUrl(source);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "jev-authorship-checker",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${apiUrl}`);
  }

  const data: unknown = await res.json();
  const body = (data as { body?: unknown })?.body;
  if (body !== null && typeof body !== "string") {
    throw new Error(`GitHub API response missing a string body for ${apiUrl}`);
  }
  return body ?? "";
}
