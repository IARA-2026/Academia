const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

const pastaDados = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(pastaDados, { recursive: true });

const caminhoBanco = path.join(pastaDados, 'academia.sqlite');
const db = new Database(caminhoBanco);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modalidade TEXT NOT NULL,
    instrutor TEXT NOT NULL,
    horario TEXT NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0),
    matriculados INTEGER NOT NULL DEFAULT 0 CHECK (matriculados >= 0)
  )
`);

module.exports = db;