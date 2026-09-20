import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads the API key and defaults the port to 3000", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "sk-test" });
    expect(cfg.typesafeApiKey).toBe("sk-test");
    expect(cfg.port).toBe(3000);
  });

  it("parses a custom port", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "sk-test", PORT: "8080" });
    expect(cfg.port).toBe(8080);
  });

  it("throws when the API key is missing", () => {
    expect(() => loadConfig({})).toThrow(/TYPESAFE_API_KEY/);
  });

  it("throws on a non-numeric port", () => {
    expect(() => loadConfig({ TYPESAFE_API_KEY: "sk-test", PORT: "abc" })).toThrow(/PORT/);
  });

  it("defaults private-repo gating to closed with an empty allowlist", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "sk-test" });
    expect(cfg.allowPrivateRepos).toBe(false);
    expect(cfg.privateRepoAllowlist).toEqual(new Set());
    expect(cfg.githubToken).toBeUndefined();
  });

  it("reads GITHUB_TOKEN when set", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "sk-test", GITHUB_TOKEN: "ghp_x" });
    expect(cfg.githubToken).toBe("ghp_x");
  });

  it("enables private repos only when ALLOW_PRIVATE_REPOS is true", () => {
    expect(loadConfig({ TYPESAFE_API_KEY: "k", ALLOW_PRIVATE_REPOS: "true" }).allowPrivateRepos).toBe(true);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", ALLOW_PRIVATE_REPOS: "false" }).allowPrivateRepos).toBe(false);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", ALLOW_PRIVATE_REPOS: "yes" }).allowPrivateRepos).toBe(false);
  });

  it("normalizes the allowlist to lowercase owner/repo entries", () => {
    const cfg = loadConfig({
      TYPESAFE_API_KEY: "k",
      PRIVATE_REPO_ALLOWLIST: "Owner/Repo, foo/bar ,,  ",
    });
    expect(cfg.privateRepoAllowlist).toEqual(new Set(["owner/repo", "foo/bar"]));
  });

  it("defaults the submit password to empty (open submit) and the anon rate to 5/min", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "k" });
    expect(cfg.submitPassword).toBe("");
    expect(cfg.anonRatePerMin).toBe(5);
  });

  it("reads SUBMIT_PASSWORD verbatim when set", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "k", SUBMIT_PASSWORD: "hunter2" });
    expect(cfg.submitPassword).toBe("hunter2");
  });

  it("parses a custom anon rate", () => {
    const cfg = loadConfig({ TYPESAFE_API_KEY: "k", ANON_RATE_PER_MIN: "20" });
    expect(cfg.anonRatePerMin).toBe(20);
  });

  it("throws on a non-positive or non-numeric anon rate", () => {
    expect(() => loadConfig({ TYPESAFE_API_KEY: "k", ANON_RATE_PER_MIN: "0" })).toThrow(/ANON_RATE_PER_MIN/);
    expect(() => loadConfig({ TYPESAFE_API_KEY: "k", ANON_RATE_PER_MIN: "-3" })).toThrow(/ANON_RATE_PER_MIN/);
    expect(() => loadConfig({ TYPESAFE_API_KEY: "k", ANON_RATE_PER_MIN: "abc" })).toThrow(/ANON_RATE_PER_MIN/);
  });

  it("defaults trust proxy to false (direct connection)", () => {
    expect(loadConfig({ TYPESAFE_API_KEY: "k" }).trustProxy).toBe(false);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", TRUST_PROXY: "" }).trustProxy).toBe(false);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", TRUST_PROXY: "false" }).trustProxy).toBe(false);
  });

  it("parses TRUST_PROXY as a hop count, boolean, or passthrough value", () => {
    expect(loadConfig({ TYPESAFE_API_KEY: "k", TRUST_PROXY: "1" }).trustProxy).toBe(1);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", TRUST_PROXY: "true" }).trustProxy).toBe(true);
    expect(loadConfig({ TYPESAFE_API_KEY: "k", TRUST_PROXY: "loopback" }).trustProxy).toBe("loopback");
  });

  it("defaults Jev token prices and reads overrides", () => {
    const def = loadConfig({ TYPESAFE_API_KEY: "k" });
    expect(def.jevInputPricePerMTok).toBe(0.042);
    expect(def.jevOutputPricePerMTok).toBe(0);
    const over = loadConfig({ TYPESAFE_API_KEY: "k", JEV_INPUT_PRICE_PER_MTOK: "0.1", JEV_OUTPUT_PRICE_PER_MTOK: "0.2" });
    expect(over.jevInputPricePerMTok).toBe(0.1);
    expect(over.jevOutputPricePerMTok).toBe(0.2);
  });

  it("rejects a negative price", () => {
    expect(() => loadConfig({ TYPESAFE_API_KEY: "k", JEV_INPUT_PRICE_PER_MTOK: "-1" })).toThrow(/Price/);
  });
});
