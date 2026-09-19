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

  it("ignores query strings on the issue path", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7?foo=1")).toEqual({
      owner: "a",
      repo: "b",
      kind: "issue",
      number: 7,
    });
  });

  it("parses an issue comment fragment", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7#issuecomment-99")).toEqual({
      owner: "a",
      repo: "b",
      kind: "issue-comment",
      commentId: 99,
    });
  });

  it("parses a pull request URL to the PR body", () => {
    expect(parseGitHubUrl("https://github.com/a/b/pull/7")).toEqual({
      owner: "a",
      repo: "b",
      kind: "pull",
      number: 7,
    });
  });

  it("parses a PR review comment fragment (#discussion_r)", () => {
    expect(parseGitHubUrl("https://github.com/a/b/pull/7#discussion_r12345")).toEqual({
      owner: "a",
      repo: "b",
      kind: "pull-review-comment",
      commentId: 12345,
    });
  });

  it("parses an issue-style comment on a PR (#issuecomment on a pull URL)", () => {
    expect(parseGitHubUrl("https://github.com/a/b/pull/7#issuecomment-55")).toEqual({
      owner: "a",
      repo: "b",
      kind: "issue-comment",
      commentId: 55,
    });
  });

  it("rejects a #discussion_r fragment on an issue URL (only PRs have review comments)", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7#discussion_r99")).toBeNull();
  });

  it("rejects an unrecognized fragment", () => {
    expect(parseGitHubUrl("https://github.com/a/b/issues/7#random")).toBeNull();
  });

  it("rejects a non-github host", () => {
    expect(parseGitHubUrl("https://gitlab.com/a/b/issues/7")).toBeNull();
  });

  it("rejects an unknown section", () => {
    expect(parseGitHubUrl("https://github.com/a/b/commits/7")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(parseGitHubUrl("not a url")).toBeNull();
    expect(parseGitHubUrl("")).toBeNull();
  });
});
