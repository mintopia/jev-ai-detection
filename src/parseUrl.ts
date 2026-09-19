export type ParsedSource =
  | { kind: "issue"; owner: string; repo: string; number: number }
  | { kind: "pull"; owner: string; repo: string; number: number }
  | { kind: "issue-comment"; owner: string; repo: string; commentId: number }
  | { kind: "pull-review-comment"; owner: string; repo: string; commentId: number };

const ISSUE_COMMENT = /^#issuecomment-(\d+)$/;
const REVIEW_COMMENT = /^#discussion_r(\d+)$/;

export function parseGitHubUrl(input: string): ParsedSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.hostname !== "github.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4) return null;

  const [owner, repo, section, rawNumber] = parts;
  if (!owner || !repo) return null;
  if (section !== "issues" && section !== "pull") return null;

  const number = Number(rawNumber);
  if (!Number.isInteger(number) || number <= 0) return null;

  if (url.hash) {
    const issueComment = ISSUE_COMMENT.exec(url.hash);
    if (issueComment) {
      return { kind: "issue-comment", owner, repo, commentId: Number(issueComment[1]) };
    }
    const reviewComment = REVIEW_COMMENT.exec(url.hash);
    if (reviewComment && section === "pull") {
      return { kind: "pull-review-comment", owner, repo, commentId: Number(reviewComment[1]) };
    }
    return null;
  }

  return section === "pull"
    ? { kind: "pull", owner, repo, number }
    : { kind: "issue", owner, repo, number };
}
