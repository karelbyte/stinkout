import { createClient, type Client, type ResultSet, type InValue } from "@libsql/client";

let client: Client | null = null;
let initPromise: Promise<void> | null = null;
let schemaReady = false;

async function doInitSchema(c: Client) {
  if (schemaReady) return;
  schemaReady = true;

  const stmts = [
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT DEFAULT 'user', created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), token TEXT NOT NULL UNIQUE, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, website TEXT, slug TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS recruiters (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, company_id INTEGER REFERENCES companies(id), email TEXT, slug TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), recruiter_id INTEGER REFERENCES recruiters(id), company_id INTEGER REFERENCES companies(id), title TEXT NOT NULL, description TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5), status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')), created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS evidence (id INTEGER PRIMARY KEY AUTOINCREMENT, review_id INTEGER NOT NULL REFERENCES reviews(id), user_id INTEGER REFERENCES users(id), file_name TEXT NOT NULL, file_type TEXT NOT NULL, file_path TEXT NOT NULL, file_size INTEGER, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS evidence_validations (id INTEGER PRIMARY KEY AUTOINCREMENT, evidence_id INTEGER NOT NULL REFERENCES evidence(id), user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')), UNIQUE(evidence_id, user_id))",
    "CREATE INDEX IF NOT EXISTS idx_recruiters_name ON recruiters(name)",
    "CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company_id)",
    "CREATE INDEX IF NOT EXISTS idx_reviews_recruiter ON reviews(recruiter_id)",
    "CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id)",
    "CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)",
    "CREATE INDEX IF NOT EXISTS idx_evidence_review ON evidence(review_id)",
    "CREATE TABLE IF NOT EXISTS review_ratifications (id INTEGER PRIMARY KEY AUTOINCREMENT, review_id INTEGER NOT NULL REFERENCES reviews(id), user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')), UNIQUE(review_id, user_id))",
    "CREATE INDEX IF NOT EXISTS idx_validations_evidence ON evidence_validations(evidence_id)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)",
    "CREATE TABLE IF NOT EXISTS review_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, review_id INTEGER NOT NULL REFERENCES reviews(id), user_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, review_id INTEGER NOT NULL REFERENCES reviews(id), user_id INTEGER NOT NULL REFERENCES users(id), reason TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(review_id, user_id))",
    "CREATE INDEX IF NOT EXISTS idx_ratifications_review ON review_ratifications(review_id)",
    "CREATE INDEX IF NOT EXISTS idx_comments_review ON review_comments(review_id)",
    "CREATE INDEX IF NOT EXISTS idx_reports_review ON reports(review_id)",
    "ALTER TABLE recruiters ADD COLUMN slug TEXT UNIQUE",
    "ALTER TABLE companies ADD COLUMN slug TEXT UNIQUE",
  ];

  for (const stmt of stmts) {
    try { await c.execute(stmt); } catch { /* column may already exist */ }
  }
}

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DB_URL;
    if (!url) throw new Error("TURSO_DB_URL environment variable is not set. See .env.local.example");
    client = createClient({
      url,
      authToken: process.env.TURSO_DB_AUTH_TOKEN,
    });
    initPromise = doInitSchema(client);
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  getDb();
  if (initPromise) await initPromise;
}

export async function dbAll<T = Record<string, unknown>>(sql: string, ...args: InValue[]): Promise<T[]> {
  await ensureSchema();
  const { rows } = await client!.execute({ sql, args });
  return rows.map((r) => ({ ...r } as T));
}

export async function dbGet<T = Record<string, unknown>>(sql: string, ...args: InValue[]): Promise<T | undefined> {
  await ensureSchema();
  const { rows } = await client!.execute({ sql, args });
  if (!rows[0]) return undefined;
  return { ...rows[0] } as T;
}

export async function dbRun(sql: string, ...args: InValue[]): Promise<ResultSet> {
  await ensureSchema();
  return client!.execute({ sql, args });
}
