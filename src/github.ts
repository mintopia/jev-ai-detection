import type { ParsedSource } from "./parseUrl.js";

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "jev-authorship-checker",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export interface RepoVisibility {
  isPrivate: boolean;
}

export async function fetchRepoVisibility(owner: string, repo: string, token?: string): Promise<RepoVisibility> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(apiUrl, { headers: githubHeaders(token) });
  if (res.status === 404) {
    return { isPrivate: true };
  }
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${apiUrl}`);
  }
  const data: unknown = await res.json();
  return { isPrivate: (data as { private?: unknown })?.private === true };
}

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

export async function fetchSourceText(source: ParsedSource, token?: string): Promise<string> {
  const apiUrl = buildApiUrl(source);
  const res = await fetch(apiUrl, { headers: githubHeaders(token) });
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
