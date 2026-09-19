# 01: Walking skeleton — end-to-end tracer bullet

**What to build:** A user pastes a public GitHub *issue* URL into a form, submits, and lands on a stored result page (`/r/:id`) that shows an AI-written verdict, the confidence %, and the top "which AI" guess. This cuts one complete path through every layer — form, URL parse, GitHub fetch, real Jev call, SQLite store, result render — proving the whole pipe including the first live Jev request.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Express + TypeScript server boots; env config loaded (`OPENROUTER_API_KEY` required, `PORT`); SQLite initialized with the `analyses` table.
- [ ] `GET /` serves a paste form (URL field + submit).
- [ ] `POST /analyze` parses a `/owner/repo/issues/N` URL and fetches the issue body via the GitHub REST API (unauthenticated is fine here).
- [ ] Jev is called at `POST https://openrouter.ai/api/alpha/decisions` with `is_ai` (noul) and `which_ai` (choice over human/claude/gpt/gemini/grok/other). The live response shape is verified against a real key; wrapper adjusted if it differs from the documented example.
- [ ] Result persisted to SQLite with an unguessable crypto-random id.
- [ ] `POST /analyze` redirects to `GET /r/:id`, which renders verdict (Yes/No from `noul >= 0.5` for now), the AI-written %, and the top which-AI label. Stored text is HTML-escaped on render.
