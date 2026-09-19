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
});
