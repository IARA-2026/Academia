// Camada de dados: concentra as consultas SQL usadas pelo recurso de aulas.
// As consultas usam parâmetros para não montar SQL com dados recebidos do usuário.
const db = require('./db');

/**
 * Lista todas as aulas em ordem crescente de ID.
 *
 * @returns {object[]} aulas encontradas
 * @throws {Error} se ocorrer uma falha na consulta ao SQLite
 */
function listarTodas() {
  return db.prepare(`
    SELECT
      a.id,
      a.modalidade,
      a.instrutor,
      a.horario,
      a.capacidade,
      COUNT(m.id) AS matriculados
    FROM aulas AS a
    LEFT JOIN matriculas AS m
      ON m.aula_id = a.id AND m.status = 'ativa'
    GROUP BY a.id
    ORDER BY a.id
  `).all();
}

/**
 * Busca uma aula pelo ID.
 *
 * @param {number} id identificador da aula
 * @returns {object|null} aula encontrada ou null
 * @throws {Error} se ocorrer uma falha na consulta ao SQLite
 */
function buscarPorId(id) {
  return db.prepare(`
    SELECT
      a.id,
      a.modalidade,
      a.instrutor,
      a.horario,
      a.capacidade,
      COUNT(m.id) AS matriculados
    FROM aulas AS a
    LEFT JOIN matriculas AS m
      ON m.aula_id = a.id AND m.status = 'ativa'
    WHERE a.id = ?
    GROUP BY a.id
  `).get(id) ?? null;
}

/**
 * Conta as aulas armazenadas.
 *
 * @returns {number} quantidade de aulas
 * @throws {Error} se ocorrer uma falha na consulta ao SQLite
 */
function contar() {
  const resultado = db.prepare('SELECT COUNT(*) AS total FROM aulas').get();
  return resultado.total;
}

/**
 * Grava uma aula e retorna o registro criado.
 *
 * @param {{modalidade: string, instrutor: string, horario: string, capacidade: number}} dados dados da aula
 * @returns {object} aula criada
 * @throws {Error} se ocorrer uma falha na gravação ou consulta ao SQLite
 */
function criar(dados) {
  const resultado = db.prepare(`
    INSERT INTO aulas (modalidade, instrutor, horario, capacidade, matriculados)
    VALUES (?, ?, ?, ?, 0)
  `).run(
    dados.modalidade,
    dados.instrutor,
    dados.horario,
    dados.capacidade
  );

  return buscarPorId(Number(resultado.lastInsertRowid));
}

/**
 * Atualiza os dados editáveis de uma aula.
 *
 * @param {number} id identificador da aula
 * @param {{modalidade: string, instrutor: string, horario: string, capacidade: number}} dados novos dados
 * @returns {boolean} true se uma aula foi atualizada
 * @throws {Error} se ocorrer uma falha na atualização ao SQLite
 */
function atualizar(id, dados) {
  const resultado = db.prepare(`
    UPDATE aulas
    SET modalidade = ?, instrutor = ?, horario = ?, capacidade = ?
    WHERE id = ?
  `).run(
    dados.modalidade,
    dados.instrutor,
    dados.horario,
    dados.capacidade,
    id
  );

  return resultado.changes > 0;
}

/**
 * Exclui uma aula pelo ID.
 *
 * @param {number} id identificador da aula
 * @returns {boolean} true se uma aula foi excluída
 * @throws {Error} se ocorrer uma falha na exclusão ao SQLite
 */
function excluir(id) {
  const resultado = db.prepare('DELETE FROM aulas WHERE id = ?').run(id);
  return resultado.changes > 0;
}

function contarMatriculas(aulaId) {
  const resultado = db.prepare(
    'SELECT COUNT(*) AS total FROM matriculas WHERE aula_id = ?'
  ).get(aulaId);

  return resultado.total;
}

module.exports = {
  listarTodas,
  buscarPorId,
  contar,
  contarMatriculas,
  criar,
  atualizar,
  excluir
};
