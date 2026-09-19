# Jev Authorship Checker

A small web app that takes a GitHub issue/PR/comment URL, fetches the target text, and asks TypeSafe's Jev model (via OpenRouter's Decisions API) whether the text is AI-written and which AI likely wrote it. Results are stored and shareable via permalink.

## Stack

- Node + TypeScript, single Express server, server-rendered HTML (no frontend framework).
- `better-sqlite3` for storage (near-zero concurrent writes).

## Jev integration

- Endpoint: `POST https://openrouter.ai/api/alpha/decisions`
- Header: `Authorization: Bearer $OPENROUTER_API_KEY`
- Body: `{ model: "typesafe/jev-1.13", state: "<text>", questions: { is_ai: {type:"noul", ...}, which_ai: {type:"choice", criteria:{human,claude,gpt,gemini,grok,other}, ...} } }`
- Response: `answers.is_ai.noul` (0–1 AI-written probability); `answers.which_ai.choice` + `answers.which_ai.probabilities` (per-label map).
- Provider path unverified against a live key — first real call is an empirical check (see ticket 01).

## Verdict logic

- `noul < 0.4` → No (human); `0.4–0.6` → Uncertain; `> 0.6` → Yes (AI). Raw % always shown.
- Which-AI shown only on Yes / Uncertain.
- Honesty note: Jev's calibration holds across groups, not per-answer.

## Input shapes (GitHub)

- `/owner/repo/issues/N` → issue body
- `/owner/repo/issues/N#issuecomment-ID` → that comment
- `/owner/repo/pull/N` → PR body
- `/owner/repo/pull/N#discussion_rID` (or `#issuecomment-ID`) → that comment

## Config (env vars)

`OPENROUTER_API_KEY` (required) · `GITHUB_TOKEN` (optional) · `ALLOW_PRIVATE_REPOS=false` · `PRIVATE_REPO_ALLOWLIST=` · `SUBMIT_PASSWORD=` (blank = open submit) · `ANON_RATE_PER_MIN=5` · `PORT`

## Security / limits

- Private repo → blocked before any fetch unless allowlisted.
- Viewing public; submitting open unless `SUBMIT_PASSWORD` set. Correct password → no rate limit. Anon → leaky bucket, IP-keyed, IPv6 grouped to /56.
- API keys server-side only; result ids unguessable (crypto random); all stored text HTML-escaped on render.

## Storage

`analyses(id, source_url, source_type, analyzed_text, is_ai_noul, which_ai, probabilities_json, created_at)`
