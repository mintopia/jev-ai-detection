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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function insertAnalysis(db: Database.Database, row: NewAnalysis): string {
  const id = randomBytes(16).toString("hex");
  db.prepare(
    `INSERT INTO analyses
       (id, source_url, source_type, analyzed_text, is_ai_noul, which_ai, probabilities_json)
     VALUES
       (@id, @source_url, @source_type, @analyzed_text, @is_ai_noul, @which_ai, @probabilities_json)`,
  ).run({ id, ...row });
  return id;
}

export function getAnalysis(db: Database.Database, id: string): Analysis | undefined {
  return db.prepare("SELECT * FROM analyses WHERE id = ?").get(id) as Analysis | undefined;
}
