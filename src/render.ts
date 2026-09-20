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

const STYLES = `
:root {
  --canvas: #f6f8fa;
  --surface: #ffffff;
  --border: #d0d7de;
  --border-muted: #d8dee4;
  --fg: #1f2328;
  --fg-muted: #656d76;
  --accent: #0969da;
  --btn-primary: #1f883d;
  --btn-primary-hover: #1a7f37;
  --btn-primary-border: rgba(31,35,40,0.15);
  --track: #eaeef2;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  min-height: 100vh;
  background: var(--canvas);
  color: var(--fg);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

::selection { background: #ddf4ff; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: -1px; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.topbar { background: var(--surface); border-bottom: 1px solid var(--border); }
.wrap { width: min(768px, 100% - 32px); margin: 0 auto; }
.topbar .wrap { display: flex; align-items: center; gap: 8px; height: 56px; }
.brand { font-size: 16px; font-weight: 600; color: var(--fg); }
.brand svg { color: var(--fg); vertical-align: -3px; margin-right: 8px; }
.main { padding: 28px 0 56px; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 24px;
}
.card + .card, .verdict + .card, .card + .source, .verdict + .source { margin-top: 16px; }
.source + .actions { margin-top: 20px; }

h1.h { margin: 0 0 6px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.sub { margin: 0 0 20px; color: var(--fg-muted); font-size: 15px; max-width: 60ch; }
h2.h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }

.probe { display: grid; gap: 16px; }
.field { display: grid; gap: 6px; }
label { font-size: 13px; font-weight: 600; color: var(--fg); }
input[type="url"], input[type="password"] {
  width: 100%;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 20px;
}
input::placeholder { color: #8c959f; }
input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(9,105,218,0.3); }

.btn {
  justify-self: start;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #f6f8fa;
  color: var(--fg);
  font-family: var(--sans);
  font-size: 14px; font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease;
  text-decoration: none;
}
.btn:hover { background: #eff2f5; border-color: #c8cdd4; text-decoration: none; }
.btn:active { background: #e6eaef; }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.btn-primary {
  background: var(--btn-primary);
  border-color: var(--btn-primary-border);
  color: #ffffff;
  box-shadow: 0 1px 0 rgba(31,35,40,0.04);
}
.btn-primary:hover { background: var(--btn-primary-hover); border-color: var(--btn-primary-border); }
.btn-primary:active { background: #187733; }
.is-running .btn-primary { opacity: 0.7; cursor: progress; }

.alert {
  display: flex; align-items: flex-start; gap: 10px;
  margin: 0 0 20px; padding: 12px 14px;
  background: #fff8c5;
  border: 1px solid rgba(212,167,44,0.4);
  border-radius: 6px;
  color: var(--fg);
  font-size: 14px;
}
.alert svg { flex: none; margin-top: 1px; color: #9a6700; }

/* ---------- result ---------- */
.verdict {
  background: var(--tone-bg);
  border: 1px solid var(--tone-border);
  border-radius: 6px;
  padding: 24px;
}
.verdict-h { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; color: var(--fg); }
.verdict-sub { margin: 6px 0 0; color: var(--fg-muted); font-size: 15px; }

.gauge { margin-top: 22px; }
.gauge-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.gauge-pct {
  font-family: var(--mono);
  font-size: 34px; font-weight: 600; line-height: 1;
  color: var(--tone);
  font-variant-numeric: tabular-nums;
}
.gauge-cap { font-size: 13px; color: var(--fg-muted); }
.scale { position: relative; padding-top: 22px; }
.scale-track {
  height: 8px; border-radius: 4px;
  border: 1px solid rgba(31,35,40,0.08);
  background: linear-gradient(90deg,
    rgba(74,194,107,0.25) 0 40%,
    rgba(212,167,44,0.25) 40% 60%,
    rgba(255,129,130,0.3) 60% 100%);
}
.scale-track .tick { position: absolute; top: 22px; width: 1px; height: 8px; background: rgba(31,35,40,0.18); }
.scale-marker { position: absolute; top: 15px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
.scale-marker .flag {
  font-family: var(--mono); font-size: 12px; font-weight: 600;
  color: #ffffff; background: var(--tone);
  padding: 1px 6px; border-radius: 4px; margin-bottom: 5px;
  white-space: nowrap; font-variant-numeric: tabular-nums;
}
.scale-marker .needle { width: 2px; height: 20px; background: var(--tone); }
.scale-legend { display: flex; margin-top: 10px; font-size: 12px; color: var(--fg-muted); }
.scale-legend .z-human { width: 40%; }
.scale-legend .z-uncertain { width: 20%; text-align: center; }
.scale-legend .z-ai { width: 40%; text-align: right; }
.scale-legend .on { color: var(--fg); font-weight: 600; }

.most-likely { margin: 0 0 18px; font-size: 14px; color: var(--fg-muted); }
.most-likely strong { color: var(--fg); font-weight: 600; }

.prob-bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.prob-bars li { display: grid; grid-template-columns: 80px 1fr 44px; align-items: center; gap: 12px; }
.prob-bars li > span:first-child { font-size: 13px; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prob-bars li > span:last-child { font-family: var(--mono); font-size: 12px; text-align: right; color: var(--fg-muted); font-variant-numeric: tabular-nums; }
progress {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 8px; border: none; border-radius: 4px;
  background: var(--track); overflow: hidden;
}
progress::-webkit-progress-bar { background: var(--track); border-radius: 4px; }
progress::-webkit-progress-value { background: var(--accent); border-radius: 4px; }
progress::-moz-progress-bar { background: var(--accent); border-radius: 4px; }

.code {
  margin: 0; padding: 16px;
  max-height: 320px; overflow: auto;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 12px; line-height: 1.6;
  color: var(--fg);
  white-space: pre-wrap; overflow-wrap: anywhere;
}

.source { margin: 16px 0 0; font-size: 13px; color: var(--fg-muted); }
.source a { overflow-wrap: anywhere; }

@media (max-width: 480px) {
  .prob-bars li { grid-template-columns: 64px 1fr 40px; gap: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<header class="topbar"><div class="wrap"><span class="brand">${LOGO_SVG}AI Content Detector</span></div></header>
<main class="wrap main">
${body}
</main>
${SCRIPT}
</body>
</html>`;
}

const LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-3.25a.75.75 0 0 1 .75.75v2.19l1.28 1.28a.75.75 0 1 1-1.06 1.06L7.47 8.28A.75.75 0 0 1 7.25 7.75V5.5A.75.75 0 0 1 8 4.75Z"/></svg>`;

const ARROW_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/></svg>`;

const WARN_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`;

const SCRIPT = `<script>
(function(){
  var f = document.querySelector('form.probe');
  if (f) f.addEventListener('submit', function(e){
    if (f.classList.contains('is-running')) { e.preventDefault(); return; }
    f.classList.add('is-running');
    f.setAttribute('aria-busy', 'true');
    var b = f.querySelector('button.btn-primary');
    if (b) b.textContent = 'Analyzing\\u2026';
  });
})();
</script>`;

export interface FormOptions {
  error?: string;
  requirePassword?: boolean;
}

export function renderForm(opts: FormOptions = {}): string {
  const { error, requirePassword = false } = opts;
  const errorHtml = error
    ? `<p class="alert" role="alert">${WARN_SVG}<span>${escapeHtml(error)}</span></p>`
    : "";
  const passwordHtml = requirePassword
    ? `  <div class="field">
    <label for="password">Submit password</label>
    <input id="password" type="password" name="password" placeholder="Required to submit" required>
  </div>
`
    : "";
  return page(
    "AI Content Detector",
    `<div class="card">
<h1 class="h">Is this text AI-written?</h1>
<p class="sub">Paste a public GitHub issue, pull request, or comment URL. We read the text and estimate whether it was written by AI &mdash; and which model most likely wrote it.</p>
${errorHtml}<form class="probe" method="post" action="/analyze">
  <div class="field">
    <label for="url">Source URL</label>
    <input id="url" type="url" name="url" placeholder="https://github.com/owner/repo/issues/123" required autofocus>
  </div>
${passwordHtml}  <button class="btn btn-primary" type="submit">Analyze ${ARROW_SVG}</button>
</form>
</div>`,
  );
}

const VERDICT_HEADLINE: Record<Verdict, string> = {
  Yes: "Likely AI-written",
  No: "Likely human",
  Uncertain: "Uncertain",
};

const VERDICT_VARS: Record<Verdict, string> = {
  Yes: "--tone:#cf222e;--tone-bg:#ffebe9;--tone-border:#ff8182;",
  No: "--tone:#1a7f37;--tone-bg:#dafbe1;--tone-border:#4ac26b;",
  Uncertain: "--tone:#9a6700;--tone-bg:#fff8c5;--tone-border:#d4a72c;",
};

const VERDICT_SUB: Record<Verdict, string> = {
  Yes: "This text reads as machine-generated.",
  No: "This text reads as human-written.",
  Uncertain: "The signal sits between human and machine.",
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
  if (entries.length === 0) return "<p class=\"most-likely\">No per-label breakdown available.</p>";
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
  const markerPct = Math.max(0, Math.min(100, pct));

  const whichAiSection = SHOW_WHICH_AI[verdict]
    ? `<div class="card">
<h2 class="h2">Which AI?</h2>
<p class="most-likely">Most likely written by <strong>${escapeHtml(a.which_ai)}</strong></p>
${renderProbabilityBars(a.probabilities_json)}
</div>
`
    : "";

  return page(
    "Result — AI Content Detector",
    `<div class="verdict" style="${VERDICT_VARS[verdict]}">
<h1 class="verdict-h">${VERDICT_HEADLINE[verdict]}</h1>
<p class="verdict-sub">${VERDICT_SUB[verdict]}</p>
<div class="gauge">
  <div class="gauge-head">
    <span class="gauge-pct">${pct}%</span>
    <span class="gauge-cap">estimated probability this text is AI-written</span>
  </div>
  <div class="scale">
    <div class="scale-track">
      <span class="tick" style="left:40%"></span>
      <span class="tick" style="left:60%"></span>
    </div>
    <div class="scale-marker" style="left:${markerPct}%">
      <span class="flag">${pct}%</span>
      <span class="needle"></span>
    </div>
  </div>
  <div class="scale-legend">
    <span class="z-human${verdict === "No" ? " on" : ""}">Human</span>
    <span class="z-uncertain${verdict === "Uncertain" ? " on" : ""}">Uncertain</span>
    <span class="z-ai${verdict === "Yes" ? " on" : ""}">AI</span>
  </div>
</div>
</div>
${whichAiSection}<div class="card">
<h2 class="h2">Analyzed text</h2>
<pre class="code">${escapeHtml(a.analyzed_text)}</pre>
</div>
<p class="source">Source: <a href="${escapeHtml(a.source_url)}">${escapeHtml(a.source_url)}</a></p>
<div class="actions"><a class="btn" href="/">Analyze another</a></div>`,
  );
}
