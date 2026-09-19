# 03: Private-repo gating

**What to build:** Private repositories are blocked before any content is fetched, unless the operator has explicitly allowed them. A blocked URL produces a clear message and never reaches GitHub content fetch or Jev.

**Blocked by:** 01.

**Status:** ready-for-agent

- [x] Repo visibility is checked (GitHub API) before fetching any issue/PR/comment text.
- [x] `GITHUB_TOKEN`, when set, is used for GitHub requests (raises rate limits, enables private-repo reads).
- [x] `ALLOW_PRIVATE_REPOS` defaults to false; when false, a private repo not in the allowlist is rejected with a clear "this repo is private and not permitted" message — no content fetch, no Jev call.
- [x] `PRIVATE_REPO_ALLOWLIST` (comma-separated `owner/repo`) permits listed private repos even when `ALLOW_PRIVATE_REPOS` is false.
