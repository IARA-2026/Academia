// Camada de dados: concentra as consultas SQL do recurso de matrículas.
// As relações com usuários e aulas são consultadas com parâmetros.
const db = require('./db');

/**
 * Executa uma operação usando uma transação SQLite imediata.
 *
 * @param {Function} operacao alterações que devem ser atômicas
 * @returns {Function} função que executa a transação
 * @throws {Error} se o SQLite não conseguir iniciar ou executar a transação
 */
function prepararTransacao(operacao) {
  const transacao = db.transaction(operacao);
  return (...argumentos) => transacao.immediate(...argumentos);
}

/**
 * Busca uma matrícula ativa do usuário para uma aula.
 *
 * @param {number} usuarioId identificador do usuário
 * @param {number} aulaId identificador da aula
 * @returns {object|null} matrícula encontrada ou null
 * @throws {Error} se ocorrer falha na consulta ao SQLite
 */
function buscarAtivaPorUsuarioEAula(usuarioId, aulaId) {
  return db.prepare(`
    SELECT * FROM matriculas
    WHERE usuario_id = ? AND aula_id = ? AND status = 'ativa'
  `).get(usuarioId, aulaId) ?? null;
}

/**
 * Lista as matrículas ativas do usuário com os dados de cada aula.
 *
 * @param {number} usuarioId identificador do usuário
 * @returns {object[]} matrículas relacionadas às aulas
 * @throws {Error} se ocorrer falha na consulta ao SQLite
 */
function listarPorUsuario(usuarioId) {
  return db.prepare(`
    SELECT
      m.id AS matricula_id,
      m.status,
      m.criada_em,
      a.id AS aula_id,
      a.modalidade,
      a.instrutor,
      a.horario,
      a.capacidade,
      COUNT(ocupacao.id) AS matriculados
    FROM matriculas AS m
    JOIN aulas AS a ON a.id = m.aula_id
    LEFT JOIN matriculas AS ocupacao
      ON ocupacao.aula_id = a.id AND ocupacao.status = 'ativa'
    WHERE m.usuario_id = ? AND m.status = 'ativa'
    GROUP BY m.id
    ORDER BY m.criada_em DESC, m.id DESC
  `).all(usuarioId);
}

/**
 * Conta as matrículas ativas de uma aula.
 *
 * @param {number} aulaId identificador da aula
 * @returns {number} quantidade de matrículas ativas
 * @throws {Error} se ocorrer falha na consulta ao SQLite
 */
function contarAtivasPorAula(aulaId) {
  const resultado = db.prepare(`
    SELECT COUNT(*) AS total
    FROM matriculas
    WHERE aula_id = ? AND status = 'ativa'
  `).get(aulaId);

  return resultado.total;
}

/**
 * Cria uma matrícula ativa.
 *
 * @param {number} usuarioId identificador do usuário
 * @param {number} aulaId identificador da aula
 * @returns {object} matrícula criada
 * @throws {Error} se ocorrer falha no SQLite ou violação de restrição
 */
function criar(usuarioId, aulaId) {
  const resultado = db.prepare(`
    INSERT INTO matriculas (usuario_id, aula_id, status)
    VALUES (?, ?, 'ativa')
  `).run(usuarioId, aulaId);

  return db.prepare('SELECT * FROM matriculas WHERE id = ?')
    .get(Number(resultado.lastInsertRowid));
}

/**
 * Busca uma matrícula ativa pertencente ao usuário informado.
 *
 * @param {number} id identificador da matrícula
 * @param {number} usuarioId identificador do usuário autenticado
 * @returns {object|null} matrícula própria encontrada ou null
 * @throws {Error} se ocorrer falha na consulta ao SQLite
 */
function buscarAtivaPorIdEUsuario(id, usuarioId) {
  return db.prepare(`
    SELECT * FROM matriculas
    WHERE id = ? AND usuario_id = ? AND status = 'ativa'
  `).get(id, usuarioId) ?? null;
}

/**
 * Marca como cancelada uma matrícula ativa do usuário.
 *
 * @param {number} id identificador da matrícula
 * @param {number} usuarioId identificador do usuário autenticado
 * @returns {boolean} true se a matrícula foi cancelada
 * @throws {Error} se ocorrer falha na atualização do SQLite
 */
function cancelar(id, usuarioId) {
  const resultado = db.prepare(`
    UPDATE matriculas
    SET status = 'cancelada', cancelada_em = CURRENT_TIMESTAMP
    WHERE id = ? AND usuario_id = ? AND status = 'ativa'
  `).run(id, usuarioId);

  return resultado.changes > 0;
}

function contarMatriculas(aulaId) {
  const resultado = db.prepare(
    'SELECT COUNT(*) AS total FROM matriculas WHERE aula_id = ?'
  ).get(aulaId);

  return resultado.total;
}

module.exports = {
  prepararTransacao,
  buscarAtivaPorUsuarioEAula,
  listarPorUsuario,
  contarAtivasPorAula,
  criar,
  buscarAtivaPorIdEUsuario,
  cancelar
};