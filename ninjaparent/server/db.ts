import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'ninjaparent.db')

mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK(provider IN ('gmail', 'outlook')),
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(provider, email)
  );

  CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year TEXT NOT NULL DEFAULT '',
    school TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#0d9488',
    avatar TEXT NOT NULL,
    keywords TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    subject TEXT NOT NULL,
    snippet TEXT,
    body_text TEXT,
    from_address TEXT,
    received_at INTEGER NOT NULL,
    synced_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(connection_id, message_id)
  );

  CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY,
    child_id TEXT REFERENCES children(id) ON DELETE SET NULL,
    email_id TEXT REFERENCES emails(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'email',
    due_date TEXT,
    due_label TEXT,
    urgency TEXT NOT NULL,
    priority_score INTEGER NOT NULL,
    priority_reason TEXT NOT NULL,
    amount TEXT,
    action_label TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_emails_connection ON emails(connection_id);
  CREATE INDEX IF NOT EXISTS idx_action_items_child ON action_items(child_id);
  CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    onboarded INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
`)

export function seedDefaultChildren() {
  const count = db.prepare('SELECT COUNT(*) as c FROM children').get() as { c: number }
  if (count.c > 0) return

  const children = [
    { name: 'Lily', year: 'Year 4', school: 'Oakwood Primary', color: '#8B5CF6', avatar: 'L', keywords: ['lily', 'year 4', 'y4', 'oakwood'] },
    { name: 'Noah', year: 'Year 7', school: 'Riverside Academy', color: '#3B82F6', avatar: 'N', keywords: ['noah', 'year 7', 'y7', 'riverside'] },
    { name: 'Mia', year: 'Year 2', school: 'Oakwood Primary', color: '#EC4899', avatar: 'M', keywords: ['mia', 'year 2', 'y2', 'oakwood'] },
  ]

  const insert = db.prepare(`
    INSERT INTO children (id, name, year, school, color, avatar, keywords)
    VALUES (@id, @name, @year, @school, @color, @avatar, @keywords)
  `)

  for (const child of children) {
    insert.run({
      id: randomUUID(),
      ...child,
      keywords: JSON.stringify(child.keywords),
    })
  }
}

seedDefaultChildren()
