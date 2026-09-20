import type { Analysis } from "./db.js";
import { verdictFromNoul, type Verdict } from "./verdict.js";
import {
  IS_AI_INSTRUCTIONS,
  WHICH_AI_INSTRUCTIONS,
  WHICH_AI_CRITERIA,
} from "./jev.js";

const REPO_URL = "https://github.com/mintopia/jev-ai-detection";
const TYPESAFE_URL = "https://typesafe.ai";
const TYPESAFE_GITHUB_URL = "https://github.com/typesafe-ai";
const JEV_MODELS_URL = "https://openrouter.ai/typesafe";
const JEV_MODEL_URL = "https://openrouter.ai/typesafe/jev-1.13";

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
  --canvas: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --border-muted: #21262d;
  --fg: #e6edf3;
  --fg-muted: #8b949e;
  --accent: #2f81f7;
  --btn-primary: #238636;
  --btn-primary-hover: #2ea043;
  --btn-primary-border: rgba(240,246,252,0.1);
  --track: #21262d;
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

::selection { background: rgba(56,139,253,0.4); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: -1px; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.topbar { background: var(--surface); border-bottom: 1px solid var(--border); }
.wrap { width: min(768px, 100% - 32px); margin: 0 auto; }
.topbar .wrap { display: flex; align-items: center; gap: 8px; height: 56px; }
.brand { font-size: 16px; font-weight: 600; color: var(--fg); text-decoration: none; }
.brand:hover { text-decoration: none; }
.brand svg { color: var(--fg); vertical-align: -3px; margin-right: 8px; }
.nav { margin-left: auto; display: flex; gap: 18px; }
.nav a { font-size: 14px; color: var(--fg-muted); }
.nav a:hover { color: var(--fg); }
.main { padding: 28px 0 56px; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 24px;
}
.card + .card, .verdict + .card, .card + .source, .verdict + .source { margin-top: 16px; }
.source + .actions, .card + .actions, .verdict + .actions { margin-top: 20px; }

h1.h { margin: 0 0 6px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.sub { margin: 0 0 20px; color: var(--fg-muted); font-size: 15px; }
h2.h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }

.probe { display: grid; gap: 16px; }
.field { display: grid; gap: 6px; }
label { font-size: 13px; font-weight: 600; color: var(--fg); }
input[type="url"], input[type="password"], input[type="text"] {
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
  background: #21262d;
  color: var(--fg);
  font-family: var(--sans);
  font-size: 14px; font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease;
  text-decoration: none;
}
.btn:hover { background: #30363d; border-color: #8b949e; text-decoration: none; }
.btn:active { background: #282e33; }
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
  background: rgba(187,128,9,0.15);
  border: 1px solid rgba(187,128,9,0.4);
  border-radius: 6px;
  color: var(--fg);
  font-size: 14px;
}
.alert svg { flex: none; margin-top: 1px; color: #d29922; }

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
  border: 1px solid rgba(240,246,252,0.1);
  background: linear-gradient(90deg,
    rgba(74,194,107,0.25) 0 40%,
    rgba(212,167,44,0.25) 40% 60%,
    rgba(255,129,130,0.3) 60% 100%);
}
.scale-track .tick { position: absolute; top: 22px; width: 1px; height: 8px; background: rgba(240,246,252,0.24); }
.scale-marker { position: absolute; top: 15px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
.scale-marker .flag {
  font-family: var(--mono); font-size: 12px; font-weight: 600;
  color: #0d1117; background: var(--tone);
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

.share { display: flex; gap: 8px; align-items: stretch; }
.share input { flex: 1 1 auto; min-width: 0; }
.share .btn { flex: none; }

.usage { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.usage li { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 9px 0; border-bottom: 1px solid var(--border-muted); }
.usage li:first-child { padding-top: 0; }
.usage li:last-child { border-bottom: none; padding-bottom: 0; }
.usage li > span:first-child { color: var(--fg-muted); }
.usage li > span:last-child { font-family: var(--mono); color: var(--fg); font-variant-numeric: tabular-nums; }

.steps { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.steps li { padding-left: 4px; }
.prose { margin: 0 0 12px; }
.prose:last-child { margin-bottom: 0; }
.about-q { margin: 18px 0 6px; font-size: 14px; font-weight: 600; }
.about-q:first-of-type { margin-top: 0; }
.crit { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 6px; }
.crit li { display: grid; grid-template-columns: 92px 1fr; gap: 12px; font-size: 13px; align-items: baseline; }
.crit code { font-family: var(--mono); font-size: 12px; color: var(--accent); }

@media (max-width: 480px) {
  .prob-bars li { grid-template-columns: 64px 1fr 40px; gap: 10px; }
  .crit li { grid-template-columns: 72px 1fr; }
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
<meta name="color-scheme" content="dark">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<header class="topbar"><div class="wrap"><a class="brand" href="/">${LOGO_SVG}AI Content Detector</a><nav class="nav"><a href="/">Home</a><a href="/analyze">Analyse</a></nav></div></header>
<main class="wrap main">
${body}
</main>
${SCRIPT}
</body>
</html>`;
}

const LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>`;

const ARROW_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/></svg>`;

const WARN_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`;

const SCRIPT = `<script>
(function(){
  var f = document.querySelector('form.probe');
  if (f) f.addEventListener('submit', function(e){
    if (f.classList.contains('is-running')) { e.preventDefault(); return; }
    f.classList.add('is-running');
    f.setAttribute('aria-busy', 'true');
    var b = f.querySelector('button[type="submit"]');
    if (b) b.textContent = b.getAttribute('data-loading') || 'Working\\u2026';
  });

  var link = document.querySelector('.share-link');
  if (link) {
    link.value = window.location.href;
    link.addEventListener('focus', function(){ link.select(); });
    var copy = document.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', function(){
      link.select();
      var restore = function(){
        var prev = copy.textContent;
        copy.textContent = copy.getAttribute('data-copied');
        setTimeout(function(){ copy.textContent = prev; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link.value).then(restore, function(){
          try { document.execCommand('copy'); } catch (e) {}
          restore();
        });
      } else {
        try { document.execCommand('copy'); } catch (e) {}
        restore();
      }
    });
  }
})();
</script>`;

export interface FormOptions {
  error?: string;
}

export function renderForm(opts: FormOptions = {}): string {
  const { error } = opts;
  const errorHtml = error
    ? `<p class="alert" role="alert">${WARN_SVG}<span>${escapeHtml(error)}</span></p>`
    : "";
  return page(
    "Analyse a URL — AI Content Detector",
    `<div class="card">
<h1 class="h">Is this text AI-written?</h1>
<p class="sub">Paste a public GitHub issue, pull request, or comment URL. We read the text and estimate whether it was written by AI, and which model most likely wrote it.</p>
${errorHtml}<form class="probe" method="post" action="/analyze">
  <div class="field">
    <label for="url">Source URL</label>
    <input id="url" type="url" name="url" placeholder="https://github.com/owner/repo/issues/123" required autofocus>
  </div>
  <button class="btn btn-primary" type="submit" data-loading="Analysing…">Analyse ${ARROW_SVG}</button>
</form>
</div>`,
  );
}

export function renderPasswordPrompt(error?: string): string {
  const errorHtml = error
    ? `<p class="alert" role="alert">${WARN_SVG}<span>${escapeHtml(error)}</span></p>`
    : "";
  return page(
    "Password — AI Content Detector",
    `<div class="card">
<h1 class="h">Enter the password</h1>
<p class="sub">Analysing a URL is password-protected. Enter the password to continue. This browser will stay signed in, so you won't be asked again.</p>
${errorHtml}<form class="probe" method="post" action="/login">
  <div class="field">
    <label for="password">Password</label>
    <input id="password" type="password" name="password" placeholder="Password" required autofocus>
  </div>
  <button class="btn btn-primary" type="submit" data-loading="Checking…">Continue ${ARROW_SVG}</button>
</form>
</div>`,
  );
}

export function renderLanding(): string {
  const critRows = Object.entries(WHICH_AI_CRITERIA)
    .map(
      ([label, desc]) =>
        `<li><code>${escapeHtml(label)}</code><span>${escapeHtml(desc)}</span></li>`,
    )
    .join("\n");

  return page(
    "AI Content Detector",
    `<div class="card">
<h1 class="h">How this works</h1>
<p class="prose">Paste the URL of a public GitHub issue, pull request, or comment. The tool reads the text and estimates whether a person or an AI model wrote it, and which model most likely did.</p>
<ol class="steps">
  <li>You give it the URL of a public GitHub issue, PR, or comment.</li>
  <li>The server fetches that text through GitHub's API.</li>
  <li>It sends the text to Jev, a decision model from TypeSafe, and asks two questions.</li>
  <li>Jev returns a probability that the text is AI-written, plus a per-model breakdown.</li>
  <li>The result page shows a verdict of Human, Uncertain, or AI, with the numbers behind it.</li>
</ol>
</div>
<div class="card">
<h2 class="h2">The prompt</h2>
<p class="prose">Jev answers both questions in a single call. Quoted text and code blocks are excluded, so a pasted stack trace or someone else's words don't skew the result.</p>
<p class="about-q">1. Is it AI-written? (score from 0 to 1)</p>
<pre class="code">${escapeHtml(IS_AI_INSTRUCTIONS)}</pre>
<p class="about-q">2. Which AI wrote it? (pick one label)</p>
<pre class="code">${escapeHtml(WHICH_AI_INSTRUCTIONS)}</pre>
<ul class="crit">
${critRows}
</ul>
</div>
<div class="card">
<h2 class="h2">About Jev and TypeSafe</h2>
<p class="prose">Jev is a decision model built by <a href="${escapeHtml(TYPESAFE_URL)}">TypeSafe AI</a>. It is not a chat model. You give it some text and one or more questions, each with a type, either a score from 0 to 1 or a choice from labelled options. It answers with a number and a probability breakdown rather than free-form prose, which makes the answers easy to threshold and compare.</p>
<p class="prose">This app sends text to TypeSafe's API with the <code>jev-latest</code> model. You can browse the Jev models and their pricing on <a href="${escapeHtml(JEV_MODELS_URL)}">OpenRouter</a>, read the <a href="${escapeHtml(JEV_MODEL_URL)}">jev-1.13 model page</a>, or find out more at <a href="${escapeHtml(TYPESAFE_URL)}">typesafe.ai</a> and on <a href="${escapeHtml(TYPESAFE_GITHUB_URL)}">GitHub</a>.</p>
</div>
<div class="card">
<h2 class="h2">Source</h2>
<p class="prose">This app is open source. Read it, run it yourself, or open an issue at <a href="${escapeHtml(REPO_URL)}">${escapeHtml(REPO_URL.replace("https://", ""))}</a>.</p>
</div>
<div class="actions"><a class="btn btn-primary" href="/analyze">Analyse a URL ${ARROW_SVG}</a></div>`,
  );
}

const VERDICT_HEADLINE: Record<Verdict, string> = {
  Yes: "Likely AI-written",
  No: "Likely human",
  Uncertain: "Uncertain",
};

const VERDICT_VARS: Record<Verdict, string> = {
  Yes: "--tone:#ff7b72;--tone-bg:rgba(248,81,73,0.1);--tone-border:rgba(248,81,73,0.4);",
  No: "--tone:#3fb950;--tone-bg:rgba(46,160,67,0.1);--tone-border:rgba(46,160,67,0.4);",
  Uncertain: "--tone:#d29922;--tone-bg:rgba(187,128,9,0.12);--tone-border:rgba(187,128,9,0.4);",
};

const VERDICT_SUB: Record<Verdict, string> = {
  Yes: "This text reads as machine-generated.",
  No: "This text reads as human-written.",
  Uncertain: "The signal sits between human and machine.",
};

const SHOW_WHICH_AI: Record<Verdict, boolean> = {
  Yes: true,
  Uncertain: true,
  No: true,
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

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function formatTokens(n: number | null): string {
  return n == null ? "—" : n.toLocaleString("en-US");
}

function formatCost(usd: number | null): string {
  if (usd == null) return "—";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

function mostLikelyLabel(probs: Record<string, number>, exclude: string | null): string | null {
  const entries = Object.entries(probs).filter(([label]) => label !== exclude);
  if (entries.length === 0) return null;
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
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

  const probs = parseProbabilities(a.probabilities_json);
  const attribution = mostLikelyLabel(probs, verdict === "No" ? null : "human") ?? a.which_ai;
  const attributionLine =
    verdict === "No"
      ? `Most likely written by <strong>${escapeHtml(attribution)}</strong>`
      : `Closest model match: <strong>${escapeHtml(attribution)}</strong>`;
  const whichAiSection = SHOW_WHICH_AI[verdict]
    ? `<div class="card">
<h2 class="h2">Which AI?</h2>
<p class="most-likely">${attributionLine}</p>
${renderProbabilityBars(a.probabilities_json)}
</div>
`
    : "";

  const totalTokens =
    a.input_tokens != null && a.output_tokens != null ? a.input_tokens + a.output_tokens : null;
  const hasUsage =
    a.elapsed_ms != null || a.input_tokens != null || a.output_tokens != null || a.cost_usd != null;
  const usageCard = hasUsage
    ? `<div class="card">
<h2 class="h2">Usage</h2>
<ul class="usage">
  <li><span>Time</span><span>${formatDuration(a.elapsed_ms)}</span></li>
  <li><span>Input tokens</span><span>${formatTokens(a.input_tokens)}</span></li>
  <li><span>Output tokens</span><span>${formatTokens(a.output_tokens)}</span></li>
  <li><span>Total tokens</span><span>${formatTokens(totalTokens)}</span></li>
  <li><span>Estimated cost</span><span>${formatCost(a.cost_usd)}</span></li>
</ul>
</div>
`
    : "";

  return page(
    "AI Content Detector: Result",
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
<h2 class="h2">Analysed text</h2>
<pre class="code">${escapeHtml(a.analyzed_text)}</pre>
</div>
${usageCard}<p class="source">Source: <a href="${escapeHtml(a.source_url)}">${escapeHtml(a.source_url)}</a></p>
<div class="card">
<h2 class="h2">Share this result</h2>
<div class="share">
  <input class="share-link" type="text" readonly aria-label="Shareable link to this result">
  <button class="btn share-copy" type="button" data-copied="Copied">Copy link</button>
</div>
</div>
<div class="actions"><a class="btn" href="/">Analyse another</a></div>`,
  );
}
