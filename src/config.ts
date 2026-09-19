export interface Config {
  openRouterApiKey: string;
  port: number;
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

  return { openRouterApiKey, port };
}
