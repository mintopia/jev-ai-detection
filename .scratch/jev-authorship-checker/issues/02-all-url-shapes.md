# 02: All four GitHub URL shapes

**What to build:** The paste box accepts any of the four supported GitHub URL shapes, and each pulls the correct target text before analysis — not just plain issues.

**Blocked by:** 01.

**Status:** ready-for-agent

- [x] `/owner/repo/issues/N` → issue body (already works from 01).
- [x] `/owner/repo/issues/N#issuecomment-ID` → that specific issue comment's body.
- [x] `/owner/repo/pull/N` → PR description body.
- [x] `/owner/repo/pull/N#discussion_rID` → that PR review comment; `#issuecomment-ID` on a PR → that issue-style comment.
- [x] The stored `source_type` records which shape was analyzed.
- [x] Unrecognized / unparseable URLs return a clear error, not a crash.
