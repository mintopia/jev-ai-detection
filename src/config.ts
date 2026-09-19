export interface Config {
  openRouterApiKey: string;
  port: number;
  githubToken?: string;
  allowPrivateRepos: boolean;
  privateRepoAllowlist: Set<string>;
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

  return {
    openRouterApiKey,
    port,
    githubToken: env.GITHUB_TOKEN,
    allowPrivateRepos,
    privateRepoAllowlist,
  };
}
