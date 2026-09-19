import { describe, it, expect } from "vitest";
import { openDb, insertAnalysis, getAnalysis } from "./db.js";

const sample = {
  source_url: "https://github.com/a/b/issues/1",
  source_type: "issue",
  analyzed_text: "hello world",
  is_ai_noul: 0.73,
  which_ai: "claude",
  probabilities_json: JSON.stringify({ claude: 0.6, human: 0.1 }),
};

describe("db", () => {
  it("round-trips an analysis", () => {
    const db = openDb(":memory:");
    const id = insertAnalysis(db, sample);
    const row = getAnalysis(db, id);
    expect(row).toMatchObject(sample);
    expect(row?.id).toBe(id);
    expect(row?.created_at).toBeTruthy();
  });

  it("generates unguessable 32-char hex ids", () => {
    const db = openDb(":memory:");
    const id = insertAnalysis(db, sample);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns undefined for an unknown id", () => {
    const db = openDb(":memory:");
    expect(getAnalysis(db, "nope")).toBeUndefined();
  });
});
