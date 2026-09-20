import { describe, it, expect, vi, afterEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./server.js";
import { openDb } from "./db.js";
import type { Config } from "./config.js";

function makeConfig(over: Partial<Config> = {}): Config {
  return {
    typesafeApiKey: "sk-test",
    port: 0,
    githubToken: undefined,
    allowPrivateRepos: false,
    privateRepoAllowlist: new Set<string>(),
    submitPassword: "",
    anonRatePerMin: 5,
    trustProxy: false,
    ...over,
  };
}

async function makeServer(config: Config) {
  const db = openDb(":memory:");
  const app = createApp({ db, config });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  const post = (fields: Record<string, string>, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const payload = new URLSearchParams(fields).toString();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path: "/analyze",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(payload),
            ...headers,
          },
        },
        (r) => {
          let chunks = "";
          r.on("data", (c) => (chunks += c));
          r.on("end", () => resolve({ status: r.statusCode ?? 0, body: chunks }));
        },
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  };

  return { post, close };
}

async function postAnalyze(config: Config, url: string): Promise<{ status: number; body: string }> {
  const db = openDb(":memory:");
  const app = createApp({ db, config });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const res = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const payload = `url=${encodeURIComponent(url)}`;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path: "/analyze",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (r) => {
          let chunks = "";
          r.on("data", (c) => (chunks += c));
          r.on("end", () => resolve({ status: r.statusCode ?? 0, body: chunks }));
        },
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
    return res;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /analyze private-repo gating", () => {
  it("blocks a private repo before any content fetch or Jev call", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string) => {
        calls.push(u);
        if (u === "https://api.github.com/repos/owner/secret") {
          return { ok: true, status: 200, json: async () => ({ private: true }) };
        }
        throw new Error(`blocked path should never fetch: ${u}`);
      }),
    );

    const res = await postAnalyze(makeConfig(), "https://github.com/owner/secret/issues/1");

    expect(res.status).toBe(403);
    expect(res.body).toContain("private and not permitted");
    expect(calls).toEqual(["https://api.github.com/repos/owner/secret"]);
  });

  it("allows an allowlisted private repo through to fetch and Jev", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string) => {
        calls.push(u);
        if (u === "https://api.github.com/repos/owner/secret") {
          return { ok: true, status: 200, json: async () => ({ private: true }) };
        }
        if (u === "https://api.github.com/repos/owner/secret/issues/1") {
          return { ok: true, status: 200, json: async () => ({ body: "hello" }) };
        }
        if (u === "https://api.typesafe.ai/v1/systemone") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              answers: {
                is_ai: { noul: 0.9 },
                which_ai: { choice: "claude", probabilities: { claude: 0.9 } },
              },
            }),
          };
        }
        throw new Error(`unexpected fetch: ${u}`);
      }),
    );

    const config = makeConfig({ privateRepoAllowlist: new Set(["owner/secret"]) });
    const res = await postAnalyze(config, "https://github.com/owner/secret/issues/1");

    expect(res.status).toBe(302);
    expect(calls).toContain("https://api.github.com/repos/owner/secret/issues/1");
    expect(calls).toContain("https://api.typesafe.ai/v1/systemone");
  });

  it("lets a public repo through the gate", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string) => {
        calls.push(u);
        if (u === "https://api.github.com/repos/owner/pub") {
          return { ok: true, status: 200, json: async () => ({ private: false }) };
        }
        if (u === "https://api.github.com/repos/owner/pub/issues/1") {
          return { ok: true, status: 200, json: async () => ({ body: "hi" }) };
        }
        if (u === "https://api.typesafe.ai/v1/systemone") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              answers: {
                is_ai: { noul: 0.1 },
                which_ai: { choice: "human", probabilities: { human: 0.9 } },
              },
            }),
          };
        }
        throw new Error(`unexpected fetch: ${u}`);
      }),
    );

    const res = await postAnalyze(makeConfig(), "https://github.com/owner/pub/issues/1");
    expect(res.status).toBe(302);
  });
});

describe("POST /analyze submit gating", () => {
  it("rejects submission without the password when SUBMIT_PASSWORD is set", async () => {
    const { post, close } = await makeServer(makeConfig({ submitPassword: "s3cret" }));
    try {
      const res = await post({ url: "https://github.com/owner/pub/issues/1" });
      expect(res.status).toBe(401);
      expect(res.body).toContain("password is required");
      expect(res.body).toContain('name="password"');
    } finally {
      await close();
    }
  });

  it("lets the correct password bypass the rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string) => {
        if (u === "https://api.github.com/repos/owner/pub") {
          return { ok: true, status: 200, json: async () => ({ private: false }) };
        }
        if (u === "https://api.github.com/repos/owner/pub/issues/1") {
          return { ok: true, status: 200, json: async () => ({ body: "hi" }) };
        }
        if (u === "https://api.typesafe.ai/v1/systemone") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              answers: {
                is_ai: { noul: 0.1 },
                which_ai: { choice: "human", probabilities: { human: 0.9 } },
              },
            }),
          };
        }
        throw new Error(`unexpected fetch: ${u}`);
      }),
    );

    const { post, close } = await makeServer(
      makeConfig({ submitPassword: "s3cret", anonRatePerMin: 1 }),
    );
    try {
      for (let i = 0; i < 3; i++) {
        const res = await post({
          url: "https://github.com/owner/pub/issues/1",
          password: "s3cret",
        });
        expect(res.status).toBe(302);
      }
    } finally {
      await close();
    }
  });

  it("rate-limits anonymous submissions past the configured rate", async () => {
    const { post, close } = await makeServer(makeConfig({ anonRatePerMin: 1 }));
    try {
      const first = await post({ url: "not-a-valid-url" });
      expect(first.status).toBe(400);
      const second = await post({ url: "not-a-valid-url" });
      expect(second.status).toBe(429);
      expect(second.body).toContain("Rate limited");
    } finally {
      await close();
    }
  });

  it("keys the rate limit on the forwarded client IP, not the proxy socket", async () => {
    const { post, close } = await makeServer(makeConfig({ anonRatePerMin: 1, trustProxy: 1 }));
    try {
      // Same forwarded IP twice -> second is limited.
      expect((await post({ url: "bad" }, { "X-Forwarded-For": "203.0.113.9" })).status).toBe(400);
      expect((await post({ url: "bad" }, { "X-Forwarded-For": "203.0.113.9" })).status).toBe(429);
      // A different forwarded IP has its own bucket and is allowed.
      expect((await post({ url: "bad" }, { "X-Forwarded-For": "198.51.100.4" })).status).toBe(400);
    } finally {
      await close();
    }
  });

  it("ignores X-Forwarded-For when trust proxy is off (spoof cannot dodge the limit)", async () => {
    const { post, close } = await makeServer(makeConfig({ anonRatePerMin: 1 }));
    try {
      expect((await post({ url: "bad" }, { "X-Forwarded-For": "203.0.113.1" })).status).toBe(400);
      // Different spoofed IP, but trust proxy is off so both key off the real socket.
      expect((await post({ url: "bad" }, { "X-Forwarded-For": "203.0.113.2" })).status).toBe(429);
    } finally {
      await close();
    }
  });
});
