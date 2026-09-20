import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads the API key and defaults the port to 3000", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "sk-test" });
    expect(cfg.openRouterApiKey).toBe("sk-test");
    expect(cfg.port).toBe(3000);
  });

  it("parses a custom port", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "sk-test", PORT: "8080" });
    expect(cfg.port).toBe(8080);
  });

  it("throws when the API key is missing", () => {
    expect(() => loadConfig({})).toThrow(/OPENROUTER_API_KEY/);
  });

  it("throws on a non-numeric port", () => {
    expect(() => loadConfig({ OPENROUTER_API_KEY: "sk-test", PORT: "abc" })).toThrow(/PORT/);
  });

  it("defaults private-repo gating to closed with an empty allowlist", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "sk-test" });
    expect(cfg.allowPrivateRepos).toBe(false);
    expect(cfg.privateRepoAllowlist).toEqual(new Set());
    expect(cfg.githubToken).toBeUndefined();
  });

  it("reads GITHUB_TOKEN when set", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "sk-test", GITHUB_TOKEN: "ghp_x" });
    expect(cfg.githubToken).toBe("ghp_x");
  });

  it("enables private repos only when ALLOW_PRIVATE_REPOS is true", () => {
    expect(loadConfig({ OPENROUTER_API_KEY: "k", ALLOW_PRIVATE_REPOS: "true" }).allowPrivateRepos).toBe(true);
    expect(loadConfig({ OPENROUTER_API_KEY: "k", ALLOW_PRIVATE_REPOS: "false" }).allowPrivateRepos).toBe(false);
    expect(loadConfig({ OPENROUTER_API_KEY: "k", ALLOW_PRIVATE_REPOS: "yes" }).allowPrivateRepos).toBe(false);
  });

  it("normalizes the allowlist to lowercase owner/repo entries", () => {
    const cfg = loadConfig({
      OPENROUTER_API_KEY: "k",
      PRIVATE_REPO_ALLOWLIST: "Owner/Repo, foo/bar ,,  ",
    });
    expect(cfg.privateRepoAllowlist).toEqual(new Set(["owner/repo", "foo/bar"]));
  });

  it("defaults the submit password to empty (open submit) and the anon rate to 5/min", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "k" });
    expect(cfg.submitPassword).toBe("");
    expect(cfg.anonRatePerMin).toBe(5);
  });

  it("reads SUBMIT_PASSWORD verbatim when set", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "k", SUBMIT_PASSWORD: "hunter2" });
    expect(cfg.submitPassword).toBe("hunter2");
  });

  it("parses a custom anon rate", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "k", ANON_RATE_PER_MIN: "20" });
    expect(cfg.anonRatePerMin).toBe(20);
  });

  it("throws on a non-positive or non-numeric anon rate", () => {
    expect(() => loadConfig({ OPENROUTER_API_KEY: "k", ANON_RATE_PER_MIN: "0" })).toThrow(/ANON_RATE_PER_MIN/);
    expect(() => loadConfig({ OPENROUTER_API_KEY: "k", ANON_RATE_PER_MIN: "-3" })).toThrow(/ANON_RATE_PER_MIN/);
    expect(() => loadConfig({ OPENROUTER_API_KEY: "k", ANON_RATE_PER_MIN: "abc" })).toThrow(/ANON_RATE_PER_MIN/);
  });
});
