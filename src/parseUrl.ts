export type SourceKind = "issue";

export interface ParsedSource {
  owner: string;
  repo: string;
  kind: SourceKind;
  number: number;
}

export function parseGitHubUrl(input: string): ParsedSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.hostname !== "github.com") return null;
  if (url.hash) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4) return null;

  const [owner, repo, kind, rawNumber] = parts;
  if (kind !== "issues") return null;
  if (!owner || !repo) return null;

  const number = Number(rawNumber);
  if (!Number.isInteger(number) || number <= 0) return null;

  return { owner, repo, kind: "issue", number };
}
