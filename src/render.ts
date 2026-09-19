import type { Analysis } from "./db.js";
import { verdictFromNoul, type Verdict } from "./verdict.js";

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

const VERDICT_LABELS: Record<Verdict, string> = {
  Yes: "Yes (AI)",
  No: "No (human)",
  Uncertain: "Uncertain",
};

const SHOW_WHICH_AI: Record<Verdict, boolean> = {
  Yes: true,
  Uncertain: true,
  No: false,
};

function parseProbabilities(json: string): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (e): e is [string, number] => typeof e[1] === "number",
      ),
    );
  } catch {
    return {};
  }
}

function renderProbabilityBars(json: string): string {
  const entries = Object.entries(parseProbabilities(json)).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "<p>No per-label breakdown available.</p>";
  const rows = entries
    .map(([label, p]) => {
      const pct = Math.round(p * 100);
      return `<li>
  <span>${escapeHtml(label)}</span>
  <progress value="${p}" max="1">${pct}%</progress>
  <span>${pct}%</span>
</li>`;
    })
    .join("\n");
  return `<ul class="prob-bars">\n${rows}\n</ul>`;
}

export function renderResult(a: Analysis): string {
  const verdict = verdictFromNoul(a.is_ai_noul);
  const pct = Math.round(a.is_ai_noul * 100);
  const whichAiSection = SHOW_WHICH_AI[verdict]
    ? `<h2>Which AI?</h2>
<p>Most likely: ${escapeHtml(a.which_ai)}</p>
${renderProbabilityBars(a.probabilities_json)}
`
    : "";
  return page(
    "Result — Jev Authorship Checker",
    `<h1>AI-written: ${VERDICT_LABELS[verdict]}</h1>
<p>Raw score: ${pct}% likely AI-written.</p>
${whichAiSection}<h2>Analyzed text</h2>
<pre>${escapeHtml(a.analyzed_text)}</pre>
<p>Source: <a href="${escapeHtml(a.source_url)}">${escapeHtml(a.source_url)}</a></p>
<p class="honesty-note">Jev's calibration holds across groups, not for any single answer.</p>
<p><a href="/">Check another</a></p>`,
  );
}
