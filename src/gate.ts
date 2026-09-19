import type { Config } from "./config.js";

type GatePolicy = Pick<Config, "allowPrivateRepos" | "privateRepoAllowlist">;

export function isRepoAllowed(
  owner: string,
  repo: string,
  isPrivate: boolean,
  policy: GatePolicy,
): boolean {
  if (!isPrivate) return true;
  if (policy.allowPrivateRepos) return true;
  return policy.privateRepoAllowlist.has(`${owner}/${repo}`.toLowerCase());
}
