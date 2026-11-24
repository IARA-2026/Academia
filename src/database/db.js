const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

const pastaDados = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(pastaDados, { recursive: true });

const caminhoBanco = path.join(pastaDados, 'academia.sqlite');
const db = new Database(caminhoBanco);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modalidade TEXT NOT NULL,
    instrutor TEXT NOT NULL,
    horario TEXT NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0),
    matriculados INTEGER NOT NULL DEFAULT 0 CHECK (matriculados >= 0)
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 2 AND 80),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL CHECK (papel IN ('aluno', 'admin')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS matriculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'ativa'
      CHECK (status IN ('ativa', 'cancelada')),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelada_em TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_matriculas_ativa_usuario_aula
    ON matriculas (usuario_id, aula_id)
    WHERE status = 'ativa';
`);

module.exports = db;