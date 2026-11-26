// Camada de dados: consultas SQL relacionadas aos planos.
const db = require('./db');

function buscarPorUsuario(usuarioId) {
  return db.prepare(`
    SELECT id, usuario_id, validade
    FROM planos
    WHERE usuario_id = ?
  `).get(usuarioId) ?? null;
}

function salvar(usuarioId, validade) {
  db.prepare(`
    INSERT INTO planos (usuario_id, validade)
    VALUES (?, ?)
    ON CONFLICT(usuario_id)
    DO UPDATE SET validade = excluded.validade
  `).run(usuarioId, validade);

  return buscarPorUsuario(usuarioId);
}

function buscarValidoNaData(usuarioId, dataReferencia) {
  return db.prepare(`
    SELECT id, usuario_id, validade
    FROM planos
    WHERE usuario_id = ? AND validade >= ?
  `).get(usuarioId, dataReferencia) ?? null;
}

function existeAluno(usuarioId) {
  return Boolean(db.prepare(`
    SELECT 1
    FROM usuarios
    WHERE id = ? AND papel = 'aluno'
  `).get(usuarioId));
}

module.exports = {
  buscarPorUsuario,
  salvar,
  buscarValidoNaData,
  existeAluno
};