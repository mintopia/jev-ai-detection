# 02: All four GitHub URL shapes

**What to build:** The paste box accepts any of the four supported GitHub URL shapes, and each pulls the correct target text before analysis — not just plain issues.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] `/owner/repo/issues/N` → issue body (already works from 01).
- [ ] `/owner/repo/issues/N#issuecomment-ID` → that specific issue comment's body.
- [ ] `/owner/repo/pull/N` → PR description body.
- [ ] `/owner/repo/pull/N#discussion_rID` → that PR review comment; `#issuecomment-ID` on a PR → that issue-style comment.
- [ ] The stored `source_type` records which shape was analyzed.
- [ ] Unrecognized / unparseable URLs return a clear error, not a crash.
