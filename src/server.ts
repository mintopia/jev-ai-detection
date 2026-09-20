import express from "express";
import type { Database } from "better-sqlite3";
import type { Config } from "./config.js";
import { parseGitHubUrl } from "./parseUrl.js";
import { fetchSourceText, fetchRepoVisibility } from "./github.js";
import { isRepoAllowed } from "./gate.js";
import { analyzeText } from "./jev.js";
import { insertAnalysis, getAnalysis } from "./db.js";
import { renderForm, renderResult } from "./render.js";
import { createRateLimiter, clientIpKey, checkSubmitAccess } from "./rateLimit.js";

export interface AppDeps {
  db: Database;
  config: Config;
}

export function createApp({ db, config }: AppDeps): express.Express {
  const app = express();
  // Governs how req.ip (the rate-limit key) resolves behind a proxy/relay.
  app.set("trust proxy", config.trustProxy);
  app.use(express.urlencoded({ extended: false }));

  const requirePassword = config.submitPassword !== "";
  const limiter = createRateLimiter({ ratePerMin: config.anonRatePerMin });
  const form = (error?: string): string => renderForm({ error, requirePassword });

  app.get("/", (_req, res) => {
    res.type("html").send(form());
  });

  app.post("/analyze", async (req, res) => {
    const providedPassword = typeof req.body.password === "string" ? req.body.password : "";
    const clientIp = req.ip ?? req.socket.remoteAddress ?? "";
    const access = checkSubmitAccess({
      submitPassword: config.submitPassword,
      providedPassword,
      consumeRate: () => limiter.tryConsume(clientIpKey(clientIp)),
    });
    if (access.kind === "password-required") {
      res.status(401).type("html").send(form("A submit password is required."));
      return;
    }
    if (access.kind === "rate-limited") {
      res.status(429).type("html").send(form("Rate limited — please try again shortly."));
      return;
    }

    const rawUrl = typeof req.body.url === "string" ? req.body.url : "";
    const source = parseGitHubUrl(rawUrl);
    if (!source) {
      res.status(400).type("html").send(form("Enter a public GitHub issue, PR, or comment URL like https://github.com/owner/repo/issues/123."));
      return;
    }

    try {
      const { isPrivate } = await fetchRepoVisibility(source.owner, source.repo, config.githubToken);
      if (!isRepoAllowed(source.owner, source.repo, isPrivate, config)) {
        res
          .status(403)
          .type("html")
          .send(form("This repository is private and not permitted."));
        return;
      }

      const text = await fetchSourceText(source, config.githubToken);
      const result = await analyzeText(text, config.openRouterApiKey);
      const id = insertAnalysis(db, {
        source_url: rawUrl,
        source_type: source.kind,
        analyzed_text: text,
        is_ai_noul: result.isAiNoul,
        which_ai: result.whichAi,
        probabilities_json: JSON.stringify(result.probabilities),
      });
      res.redirect(`/r/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      res.status(502).type("html").send(form(message));
    }
  });

  app.get("/r/:id", (req, res) => {
    const row = getAnalysis(db, req.params.id);
    if (!row) {
      res.status(404).type("html").send(form("No analysis found for that link."));
      return;
    }
    res.type("html").send(renderResult(row));
  });

  return app;
}
