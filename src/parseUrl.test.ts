import { describe, it, expect } from "vitest";
import { parseGitHubUrl } from "./parseUrl.js";

describe("parseGitHubUrl", () => {
  it("parses a full issue URL", () => {
    expect(parseGitHubUrl("https://github.com/octocat/Hello-World/issues/42")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      kind: "issue",
      number: 42,
    });
  });

  it("parses a URL with a trailing slash", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7/")).toEqual({
      owner: "a",
      repo: "b",
      kind: "issue",
      number: 7,
    });
  });

  it("ignores query strings and fragments on the issue path", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7?foo=1")).toEqual({
      owner: "a",
      repo: "b",
      kind: "issue",
      number: 7,
    });
  });

  it("rejects a comment fragment as out of scope for the skeleton", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7#issuecomment-99")).toBeNull();
  });

  it("rejects a pull request URL (not yet supported)", () => {
    expect(parseGitHubUrl("https://github.com/a/b/pull/7")).toBeNull();
  });

  it("rejects a non-github host", () => {
    expect(parseGitHubUrl("https://gitlab.com/a/b/issues/7")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(parseGitHubUrl("not a url")).toBeNull();
    expect(parseGitHubUrl("")).toBeNull();
  });
});
