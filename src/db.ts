import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";

export interface Analysis {
  id: string;
  source_url: string;
  source_type: string;
  analyzed_text: string;
  is_ai_noul: number;
  which_ai: string;
  probabilities_json: string;
  input_tokens: number | null;
  output_tokens: number | null;
  elapsed_ms: number | null;
  cost_usd: number | null;
  created_at: string;
}

export type NewAnalysis = Omit<Analysis, "id" | "created_at">;

export function openDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      analyzed_text TEXT NOT NULL,
      is_ai_noul REAL NOT NULL,
      which_ai TEXT NOT NULL,
      probabilities_json TEXT NOT NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      elapsed_ms INTEGER,
      cost_usd REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const existing = new Set(
    (db.prepare("PRAGMA table_info(analyses)").all() as { name: string }[]).map((c) => c.name),
  );
  for (const [name, type] of [
    ["input_tokens", "INTEGER"],
    ["output_tokens", "INTEGER"],
    ["elapsed_ms", "INTEGER"],
    ["cost_usd", "REAL"],
  ] as const) {
    if (!existing.has(name)) db.exec(`ALTER TABLE analyses ADD COLUMN ${name} ${type}`);
  }

  return db;
}

export function insertAnalysis(db: Database.Database, row: NewAnalysis): string {
  const id = randomBytes(16).toString("hex");
  db.prepare(
    `INSERT INTO analyses
       (id, source_url, source_type, analyzed_text, is_ai_noul, which_ai, probabilities_json,
        input_tokens, output_tokens, elapsed_ms, cost_usd)
     VALUES
       (@id, @source_url, @source_type, @analyzed_text, @is_ai_noul, @which_ai, @probabilities_json,
        @input_tokens, @output_tokens, @elapsed_ms, @cost_usd)`,
  ).run({ id, ...row });
  return id;
}

export function getAnalysis(db: Database.Database, id: string): Analysis | undefined {
  return db.prepare("SELECT * FROM analyses WHERE id = ?").get(id) as Analysis | undefined;
}
