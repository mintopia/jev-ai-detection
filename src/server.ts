import express from "express";
import type { Database } from "better-sqlite3";
import { parseGitHubUrl } from "./parseUrl.js";
import { fetchIssueText } from "./github.js";
import { analyzeText } from "./jev.js";
import { insertAnalysis, getAnalysis } from "./db.js";
import { renderForm, renderResult } from "./render.js";

export interface AppDeps {
  db: Database;
  apiKey: string;
}

export function createApp({ db, apiKey }: AppDeps): express.Express {
  const app = express();
  app.use(express.urlencoded({ extended: false }));

  app.get("/", (_req, res) => {
    res.type("html").send(renderForm());
  });

  app.post("/analyze", async (req, res) => {
    const rawUrl = typeof req.body.url === "string" ? req.body.url : "";
    const source = parseGitHubUrl(rawUrl);
    if (!source) {
      res.status(400).type("html").send(renderForm("Enter a public GitHub issue URL like https://github.com/owner/repo/issues/123."));
      return;
    }

    try {
      const text = await fetchIssueText(source);
      const result = await analyzeText(text, apiKey);
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
      res.status(502).type("html").send(renderForm(message));
    }
  });

  app.get("/r/:id", (req, res) => {
    const row = getAnalysis(db, req.params.id);
    if (!row) {
      res.status(404).type("html").send(renderForm("No analysis found for that link."));
      return;
    }
    res.type("html").send(renderResult(row));
  });

  return app;
}
