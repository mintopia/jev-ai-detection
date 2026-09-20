import express from "express";
import type { Database } from "better-sqlite3";
import type { Config } from "./config.js";
import { parseGitHubUrl } from "./parseUrl.js";
import { fetchSourceText, fetchRepoVisibility } from "./github.js";
import { isRepoAllowed } from "./gate.js";
import { analyzeText } from "./jev.js";
import { insertAnalysis, getAnalysis } from "./db.js";
import { renderForm, renderResult, renderLanding, renderPasswordPrompt } from "./render.js";
import { createRateLimiter, clientIpKey } from "./rateLimit.js";
import { AUTH_COOKIE, sessionToken, hasValidSession, passwordMatches } from "./session.js";

export interface AppDeps {
  db: Database;
  config: Config;
}

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function createApp({ db, config }: AppDeps): express.Express {
  const app = express();
  // Governs how req.ip (the rate-limit key) resolves behind a proxy/relay.
  app.set("trust proxy", config.trustProxy);
  app.use(express.urlencoded({ extended: false }));

  const requirePassword = config.submitPassword !== "";
  const limiter = createRateLimiter({ ratePerMin: config.anonRatePerMin });
  const isAuthed = (req: express.Request): boolean =>
    !requirePassword || hasValidSession(req.headers.cookie, config.submitPassword);
  // "Logged in" means an active session exists — distinct from isAuthed, which is
  // also true when no password is configured. Only a real session can be logged out.
  const isLoggedIn = (req: express.Request): boolean =>
    requirePassword && hasValidSession(req.headers.cookie, config.submitPassword);

  app.get("/", (req, res) => {
    res.type("html").send(renderLanding(isLoggedIn(req)));
  });

  app.get("/analyze", (req, res) => {
    if (!isAuthed(req)) {
      res.type("html").send(renderPasswordPrompt());
      return;
    }
    res.type("html").send(renderForm({ loggedIn: isLoggedIn(req) }));
  });

  app.post("/logout", (req, res) => {
    res.clearCookie(AUTH_COOKIE, { path: "/" });
    res.redirect("/");
  });

  app.post("/login", (req, res) => {
    if (!requirePassword) {
      res.redirect("/analyze");
      return;
    }
    const provided = typeof req.body.password === "string" ? req.body.password : "";
    if (!passwordMatches(provided, config.submitPassword)) {
      res.status(401).type("html").send(renderPasswordPrompt("Incorrect password."));
      return;
    }
    res.cookie(AUTH_COOKIE, sessionToken(config.submitPassword), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS,
    });
    res.redirect("/analyze");
  });

  app.post("/analyze", async (req, res) => {
    if (requirePassword) {
      if (!isAuthed(req)) {
        res.status(401).type("html").send(renderPasswordPrompt("Please enter the password to analyse."));
        return;
      }
    } else {
      const clientIp = req.ip ?? req.socket.remoteAddress ?? "";
      if (!limiter.tryConsume(clientIpKey(clientIp))) {
        res.status(429).type("html").send(renderForm({ error: "Rate limited — please try again shortly." }));
        return;
      }
    }

    const rawUrl = typeof req.body.url === "string" ? req.body.url : "";
    const source = parseGitHubUrl(rawUrl);
    if (!source) {
      res
        .status(400)
        .type("html")
        .send(renderForm({ error: "Enter a public GitHub issue, PR, or comment URL like https://github.com/owner/repo/issues/123.", loggedIn: isLoggedIn(req) }));
      return;
    }

    try {
      const { isPrivate } = await fetchRepoVisibility(source.owner, source.repo, config.githubToken);
      if (!isRepoAllowed(source.owner, source.repo, isPrivate, config)) {
        res.status(403).type("html").send(renderForm({ error: "This repository is private and not permitted.", loggedIn: isLoggedIn(req) }));
        return;
      }

      const text = await fetchSourceText(source, config.githubToken);
      const result = await analyzeText(text, config.typesafeApiKey);
      const costUsd =
        (result.inputTokens / 1_000_000) * config.jevInputPricePerMTok +
        (result.outputTokens / 1_000_000) * config.jevOutputPricePerMTok;
      const id = insertAnalysis(db, {
        source_url: rawUrl,
        source_type: source.kind,
        analyzed_text: text,
        is_ai_noul: result.isAiNoul,
        which_ai: result.whichAi,
        probabilities_json: JSON.stringify(result.probabilities),
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        elapsed_ms: result.elapsedMs,
        cost_usd: costUsd,
      });
      res.redirect(`/r/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      res.status(502).type("html").send(renderForm({ error: message, loggedIn: isLoggedIn(req) }));
    }
  });

  app.get("/r/:id", (req, res) => {
    const row = getAnalysis(db, req.params.id);
    if (!row) {
      res
        .status(404)
        .type("html")
        .send(renderForm({ error: "No analysis found for that link.", loggedIn: isLoggedIn(req) }));
      return;
    }
    res.type("html").send(renderResult(row, isLoggedIn(req)));
  });

  return app;
}
