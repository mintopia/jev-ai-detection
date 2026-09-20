# AI Content Detector

A small web app that guesses whether a GitHub issue, pull request, or comment was written by a person or an AI model, and which model most likely wrote it.

Paste a public GitHub URL. The app fetches the text, sends it to Jev (a decision model from TypeSafe), and shows a verdict of Human, Uncertain, or AI, with the per-model breakdown behind it. It excludes quoted text and code blocks from the judgment, so a pasted stack trace or someone else's words don't skew the result.

## How it works

1. You submit the URL of a public GitHub issue, PR, or comment.
2. The server reads that text through GitHub's API.
3. It asks Jev two questions in one call: is this AI-written (scored 0 to 1), and which model wrote it.
4. The server stores the result in SQLite and shows it on its own shareable page.

The exact prompt is on the app's `/about` page.

## Requirements

- Node.js 22+
- A TypeSafe API key for Jev

## Run it locally

```bash
npm install
export TYPESAFE_API_KEY=sk-...   # required
npm run dev                      # starts on http://localhost:3000
```

`npm start` runs the same server without file watching. `npm test` runs the suite; `npm run typecheck` runs the compiler with no emit.

## Configuration

All configuration is through environment variables.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `TYPESAFE_API_KEY` | yes | none | API key for the Jev decisions endpoint |
| `PORT` | no | `3000` | Port the server listens on |
| `DB_PATH` | no | `data.sqlite` | Path to the SQLite file |
| `GITHUB_TOKEN` | no | none | Raises the GitHub API rate limit and allows visibility checks on private repos |
| `ALLOW_PRIVATE_REPOS` | no | `false` | Set `true` to permit private repos that pass the allowlist |
| `PRIVATE_REPO_ALLOWLIST` | no | none | Comma-separated `owner/repo` entries allowed when private repos are enabled |
| `SUBMIT_PASSWORD` | no | none | When set, submitting a URL requires this password |
| `ANON_RATE_PER_MIN` | no | `5` | Anonymous submissions allowed per minute per client IP |
| `TRUST_PROXY` | no | `false` | Express `trust proxy` value (`true`, a hop count, or e.g. `loopback`). Set this when running behind a reverse proxy so rate limiting keys off the real client IP |

## Docker

Images are published to GHCR on every push to `main` (`:latest`) and on every `vX.Y.Z` tag (`:1.2.3`, `:1.2`, `:1`).

```bash
docker run -p 3000:3000 \
  -e TYPESAFE_API_KEY=sk-... \
  -v detector-data:/data \
  ghcr.io/mintopia/jev-ai-detection:latest
```

The image defaults `DB_PATH` to `/data/data.sqlite`, so mount a volume at `/data` to keep analyses across restarts.

## Deploy with Docker Compose

Put your key in a `.env` file next to the compose file (`TYPESAFE_API_KEY=sk-...`), then `docker compose up -d`.

```yaml
services:
  detector:
    image: ghcr.io/mintopia/jev-ai-detection:latest
    ports:
      - "3000:3000"
    environment:
      TYPESAFE_API_KEY: ${TYPESAFE_API_KEY:?set TYPESAFE_API_KEY in .env}
      # Behind a reverse proxy, trust one hop so rate limiting sees the real IP:
      # TRUST_PROXY: "1"
      # Gate submissions with a shared password:
      # SUBMIT_PASSWORD: ${SUBMIT_PASSWORD}
      # Higher GitHub rate limit:
      # GITHUB_TOKEN: ${GITHUB_TOKEN}
    volumes:
      - detector-data:/data
    restart: unless-stopped

volumes:
  detector-data:
```

## AI Disclosure

This project was written using AI assistance:

 - Claude Sonnet 5
 - Claude Opus 4.8

## License

MIT License

Copyright (c) 2026 Jessica Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
