import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchSourceText } from "./github.js";
import type { ParsedSource } from "./parseUrl.js";

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => ({ body }),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSourceText", () => {
  it("fetches an issue body from the issues endpoint", async () => {
    const fn = mockFetch("issue text");
    const source: ParsedSource = { kind: "issue", owner: "a", repo: "b", number: 7 };
    expect(await fetchSourceText(source)).toBe("issue text");
    expect(fn.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/a/b/issues/7");
  });

  it("fetches a PR body from the pulls endpoint", async () => {
    const fn = mockFetch("pr text");
    const source: ParsedSource = { kind: "pull", owner: "a", repo: "b", number: 7 };
    expect(await fetchSourceText(source)).toBe("pr text");
    expect(fn.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/a/b/pulls/7");
  });

  it("fetches an issue comment from the issues/comments endpoint", async () => {
    const fn = mockFetch("comment text");
    const source: ParsedSource = { kind: "issue-comment", owner: "a", repo: "b", commentId: 99 };
    expect(await fetchSourceText(source)).toBe("comment text");
    expect(fn.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/a/b/issues/comments/99");
  });

  it("fetches a PR review comment from the pulls/comments endpoint", async () => {
    const fn = mockFetch("review text");
    const source: ParsedSource = { kind: "pull-review-comment", owner: "a", repo: "b", commentId: 123 };
    expect(await fetchSourceText(source)).toBe("review text");
    expect(fn.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/a/b/pulls/comments/123");
  });

  it("returns an empty string when the body is null", async () => {
    mockFetch(null);
    const source: ParsedSource = { kind: "issue", owner: "a", repo: "b", number: 1 };
    expect(await fetchSourceText(source)).toBe("");
  });

  it("throws when the API returns a non-ok status", async () => {
    mockFetch(null, false, 404);
    const source: ParsedSource = { kind: "issue", owner: "a", repo: "b", number: 1 };
    await expect(fetchSourceText(source)).rejects.toThrow(/404/);
  });
});
