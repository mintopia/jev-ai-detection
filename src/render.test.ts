import { describe, it, expect } from "vitest";
import { escapeHtml, renderResult } from "./render.js";
import type { Analysis } from "./db.js";

describe("escapeHtml", () => {
  it("escapes all HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert("x&y")</script>'`)).toBe(
      "&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;&#39;",
    );
  });
});

describe("renderResult", () => {
  const base: Analysis = {
    id: "abc",
    source_url: "https://github.com/a/b/issues/1",
    source_type: "issue",
    analyzed_text: `<img src=x onerror=alert(1)>`,
    is_ai_noul: 0.73,
    which_ai: "claude",
    probabilities_json: "{}",
    created_at: "2026-01-01",
  };

  it("escapes stored text so it cannot inject markup", () => {
    const html = renderResult(base);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("renders the verdict and confidence percentage", () => {
    const html = renderResult(base);
    expect(html).toContain("AI-written: Yes");
    expect(html).toContain("73%");
  });

  it("shows the raw AI-written % even on a human verdict", () => {
    const html = renderResult({ ...base, is_ai_noul: 0.12 });
    expect(html).toContain("AI-written: No (human)");
    expect(html).toContain("12%");
  });

  it("hides the which-AI section on a human verdict", () => {
    const html = renderResult({ ...base, is_ai_noul: 0.12 });
    expect(html).not.toContain("Which AI?");
  });

  it("shows the which-AI section on an uncertain verdict", () => {
    const html = renderResult({ ...base, is_ai_noul: 0.5 });
    expect(html).toContain("AI-written: Uncertain");
    expect(html).toContain("Which AI?");
  });

  it("renders a per-label bar for each probability, sorted descending", () => {
    const html = renderResult({
      ...base,
      probabilities_json: JSON.stringify({ claude: 0.62, gpt: 0.2, human: 0.18 }),
    });
    expect(html).toContain('<progress value="0.62" max="1">62%</progress>');
    expect(html).toContain('<progress value="0.2" max="1">20%</progress>');
    expect(html.indexOf("claude")).toBeLessThan(html.indexOf("gpt"));
  });

  it("survives malformed probability JSON", () => {
    const html = renderResult({ ...base, probabilities_json: "not json" });
    expect(html).toContain("No per-label breakdown available.");
  });

  it("includes the calibration honesty note", () => {
    const html = renderResult(base);
    expect(html).toContain("calibration holds across groups");
  });

  it("links back to the source URL", () => {
    const html = renderResult(base);
    expect(html).toContain('href="https://github.com/a/b/issues/1"');
  });
});
