import type { ParsedSource } from "./parseUrl.js";

export async function fetchIssueText(source: ParsedSource): Promise<string> {
  const apiUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/issues/${source.number}`;
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
