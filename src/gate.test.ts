import { describe, it, expect } from "vitest";
import { isRepoAllowed } from "./gate.js";

const closed = { allowPrivateRepos: false, privateRepoAllowlist: new Set<string>() };

describe("isRepoAllowed", () => {
  it("always allows public repos", () => {
    expect(isRepoAllowed("owner", "repo", false, closed)).toBe(true);
  });

  it("blocks private repos when gating is closed and the allowlist is empty", () => {
    expect(isRepoAllowed("owner", "repo", true, closed)).toBe(false);
  });

  it("allows any private repo when ALLOW_PRIVATE_REPOS is on", () => {
    expect(
      isRepoAllowed("owner", "repo", true, { allowPrivateRepos: true, privateRepoAllowlist: new Set() }),
    ).toBe(true);
  });

  it("allows an allowlisted private repo even when gating is closed", () => {
    const cfg = { allowPrivateRepos: false, privateRepoAllowlist: new Set(["owner/repo"]) };
    expect(isRepoAllowed("owner", "repo", true, cfg)).toBe(true);
  });

  it("matches the allowlist case-insensitively", () => {
    const cfg = { allowPrivateRepos: false, privateRepoAllowlist: new Set(["owner/repo"]) };
    expect(isRepoAllowed("Owner", "Repo", true, cfg)).toBe(true);
  });

  it("does not allow a private repo missing from the allowlist", () => {
    const cfg = { allowPrivateRepos: false, privateRepoAllowlist: new Set(["other/repo"]) };
    expect(isRepoAllowed("owner", "repo", true, cfg)).toBe(false);
  });
});
