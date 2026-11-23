// Camada de dados: concentra as consultas SQL do recurso de usuários.
// Os valores recebidos são sempre passados como parâmetros ao SQLite.
const db = require('./db');

/**
 * Busca um usuário pelo e-mail.
 *
 * @param {string} email e-mail normalizado do usuário
 * @returns {object|null} registro encontrado ou null
 * @throws {Error} se ocorrer uma falha na consulta ao SQLite
 */
function buscarPorEmail(email) {
  return db
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get(email) ?? null;
}

/**
 * Busca um usuário pelo ID.
 *
 * @param {number} id identificador do usuário
 * @returns {object|null} registro encontrado ou null
 * @throws {Error} se ocorrer uma falha na consulta ao SQLite
 */
function buscarPorId(id) {
  return db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(id) ?? null;
}

/**
 * Cria um usuário e retorna o registro persistido.
 *
 * @param {{nome: string, email: string, senhaHash: string, papel: string}} dados dados já validados
 * @returns {object} registro do usuário criado
 * @throws {Error} se o e-mail violar a restrição UNIQUE ou ocorrer falha no SQLite
 */
function criar(dados) {
  const resultado = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, papel)
    VALUES (?, ?, ?, ?)
  `).run(dados.nome, dados.email, dados.senhaHash, dados.papel);

  return buscarPorId(Number(resultado.lastInsertRowid));
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  criar
};