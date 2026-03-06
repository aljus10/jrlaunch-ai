import Database from "better-sqlite3";

const db = new Database("data.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS business (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    name TEXT,
    industry TEXT,
    location TEXT,
    hours TEXT,
    phone TEXT,
    email TEXT,
    services TEXT,
    faqs TEXT,
    generated TEXT
  );
`);

export default db;