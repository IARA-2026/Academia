// Camada de dados: registra e consulta check-ins.
const db = require('./db');

function registrarSePlanoValido(usuarioId, dataReferencia) {
  const resultado = db.prepare(`
    INSERT INTO checkins (usuario_id, plano_id)
    SELECT usuario_id, id
    FROM planos
    WHERE usuario_id = ? AND validade >= ?
  `).run(usuarioId, dataReferencia);

  if (resultado.changes === 0) {
    return null;
  }

  return db.prepare(`
    SELECT id, usuario_id, plano_id, realizado_em
    FROM checkins
    WHERE id = ?
  `).get(Number(resultado.lastInsertRowid));
}

function listarPorUsuario(usuarioId) {
  return db.prepare(`
    SELECT
      c.id,
      c.realizado_em,
      p.validade AS validade_plano
    FROM checkins AS c
    JOIN planos AS p ON p.id = c.plano_id
    WHERE c.usuario_id = ?
    ORDER BY c.realizado_em DESC, c.id DESC
  `).all(usuarioId);
}

module.exports = {
  registrarSePlanoValido,
  listarPorUsuario
};