export interface Config {
  openRouterApiKey: string;
  port: number;
  githubToken?: string;
  allowPrivateRepos: boolean;
  privateRepoAllowlist: Set<string>;
  submitPassword: string;
  anonRatePerMin: number;
  trustProxy: boolean | number | string;
}

// Express "trust proxy" setting: false (direct), a hop count, or a passthrough
// value like "loopback" / a subnet. Governs how req.ip resolves the client IP.
function parseTrustProxy(raw: string | undefined): boolean | number | string {
  const v = (raw ?? "").trim();
  if (v === "" || v.toLowerCase() === "false") return false;
  if (v.toLowerCase() === "true") return true;
  const n = Number(v);
  if (Number.isInteger(n) && n >= 0) return n;
  return v;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const openRouterApiKey = env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  const port = env.PORT ? Number(env.PORT) : 3000;
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer, got: ${env.PORT}`);
  }

  const allowPrivateRepos = env.ALLOW_PRIVATE_REPOS?.toLowerCase() === "true";

  const privateRepoAllowlist = new Set(
    (env.PRIVATE_REPO_ALLOWLIST ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );

  const anonRatePerMin = env.ANON_RATE_PER_MIN ? Number(env.ANON_RATE_PER_MIN) : 5;
  if (!Number.isFinite(anonRatePerMin) || anonRatePerMin <= 0) {
    throw new Error(`ANON_RATE_PER_MIN must be a positive number, got: ${env.ANON_RATE_PER_MIN}`);
  }

  return {
    openRouterApiKey,
    port,
    githubToken: env.GITHUB_TOKEN,
    allowPrivateRepos,
    privateRepoAllowlist,
    submitPassword: env.SUBMIT_PASSWORD ?? "",
    anonRatePerMin,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}
