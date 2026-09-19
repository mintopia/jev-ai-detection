import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads the API key and defaults the port to 3000", () => {
    const cfg = loadConfig({ OPENROUTER_API_KEY: "sk-test" });
    expect(cfg).toEqual({ openRouterApiKey: "sk-test", port: 3000 });
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
});
