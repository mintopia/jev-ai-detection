import type { Analysis } from "./db.js";
import { verdictFromNoul } from "./verdict.js";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body>
${body}
</body>
</html>`;
}

export function renderForm(error?: string): string {
  const errorHtml = error ? `<p role="alert">${escapeHtml(error)}</p>` : "";
  return page(
    "Jev Authorship Checker",
    `<h1>Jev Authorship Checker</h1>
<p>Paste a public GitHub issue, PR, or comment URL to check whether it was AI-written.</p>
${errorHtml}
<form method="post" action="/analyze">
  <input type="url" name="url" placeholder="https://github.com/owner/repo/issues/123" size="60" required>
  <button type="submit">Analyze</button>
</form>`,
  );
}

export function renderResult(a: Analysis): string {
  const verdict = verdictFromNoul(a.is_ai_noul);
  const pct = Math.round(a.is_ai_noul * 100);
  return page(
    "Result — Jev Authorship Checker",
    `<h1>AI-written: ${verdict}</h1>
<p>Confidence: ${pct}% likely AI-written.</p>
<p>Top guess: ${escapeHtml(a.which_ai)}</p>
<p>Source: <a href="${escapeHtml(a.source_url)}">${escapeHtml(a.source_url)}</a></p>
<h2>Analyzed text</h2>
<pre>${escapeHtml(a.analyzed_text)}</pre>
<p><a href="/">Check another</a></p>`,
  );
}
