// Camada de serviços: aplica as regras de matrícula e cancelamento.
// O aluno é identificado pelo token, e o repositório controla a transação.
const aulasRepository = require('../database/aulas.repository');
const matriculasRepository = require('../database/matriculas.repository');

class ErroAplicacao extends Error {
  constructor(mensagem, statusCode) {
    super(mensagem);
    this.name = 'ErroAplicacao';
    this.statusCode = statusCode;
  }
}

/**
 * Converte e valida um identificador positivo.
 *
 * @param {string|number} valor identificador recebido
 * @param {string} mensagem mensagem para identificador inválido
 * @returns {number} identificador inteiro positivo
 * @throws {ErroAplicacao} 400 se o identificador for inválido
 */
function validarId(valor, mensagem) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id < 1) {
    throw new ErroAplicacao(mensagem, 400);
  }

  return id;
}

/**
 * Formata uma matrícula com os dados da aula e suas vagas atuais.
 *
 * @param {object} matricula linha retornada pela consulta com JOIN
 * @returns {object} dados públicos da matrícula
 */
function formatarMatricula(matricula) {
  return {
    id: matricula.matricula_id,
    status: matricula.status,
    criadaEm: matricula.criada_em,
    aula: {
      id: matricula.aula_id,
      modalidade: matricula.modalidade,
      instrutor: matricula.instrutor,
      horario: matricula.horario,
      capacidade: matricula.capacidade,
      matriculados: matricula.matriculados,
      vagasDisponiveis: matricula.capacidade - matricula.matriculados
    }
  };
}

/**
 * Matricula o aluno autenticado em uma aula.
 *
 * A leitura da vaga e a gravação ocorrem na mesma transação para que duas
 * requisições simultâneas não ultrapassem a capacidade. O índice UNIQUE
 * parcial também impede duas matrículas ativas do mesmo aluno na mesma aula.
 *
 * @param {number} usuarioId ID obtido do token JWT
 * @param {string|number} aulaIdValor ID da aula solicitada
 * @returns {object} matrícula criada
 * @throws {ErroAplicacao} 400 para IDs inválidos, 404 se a aula não existir ou 409 para lotação ou matrícula duplicada
 * @throws {Error} se ocorrer falha no banco de dados
 */
function matricular(usuarioId, aulaIdValor) {
  const idUsuario = validarId(usuarioId, 'ID do usuário inválido.');
  const aulaId = validarId(aulaIdValor, 'ID da aula inválido.');

  const executarTransacao = matriculasRepository.prepararTransacao(() => {
    const aula = aulasRepository.buscarPorId(aulaId);

    if (!aula) {
      throw new ErroAplicacao('Aula não encontrada.', 404);
    }

    if (
      matriculasRepository.buscarAtivaPorUsuarioEAula(idUsuario, aulaId)
    ) {
      throw new ErroAplicacao('Você já está matriculado nesta aula.', 409);
    }

    if (aula.matriculados >= aula.capacidade) {
      throw new ErroAplicacao('A aula está sem vagas disponíveis.', 409);
    }

    return matriculasRepository.criar(idUsuario, aulaId);
  });

  let matriculaCriada;

  try {
    matriculaCriada = executarTransacao();
  } catch (erro) {
    // A restrição do banco também protege contra duplicidade simultânea.
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new ErroAplicacao('Você já está matriculado nesta aula.', 409);
    }

    throw erro;
  }

  const detalhes = matriculasRepository
    .listarPorUsuario(idUsuario)
    .find((item) => item.matricula_id === matriculaCriada.id);

  return formatarMatricula(detalhes);
}

/**
 * Lista as matrículas ativas do usuário autenticado.
 *
 * @param {number} usuarioId ID obtido do token JWT
 * @returns {object[]} matrículas do próprio usuário
 * @throws {ErroAplicacao} 400 se o ID do usuário for inválido
 * @throws {Error} se ocorrer falha na consulta ao banco
 */
function listarMinhas(usuarioId) {
  const idUsuario = validarId(usuarioId, 'ID do usuário inválido.');

  return matriculasRepository
    .listarPorUsuario(idUsuario)
    .map(formatarMatricula);
}

/**
 * Cancela uma matrícula ativa que pertence ao usuário autenticado.
 *
 * @param {string|number} matriculaIdValor ID da matrícula
 * @param {number} usuarioId ID obtido do token JWT
 * @returns {void}
 * @throws {ErroAplicacao} 400 para IDs inválidos ou 404 se a matrícula não existir ou não pertencer ao usuário
 * @throws {Error} se ocorrer falha na atualização do banco
 */
function cancelar(matriculaIdValor, usuarioId) {
  const matriculaId = validarId(
    matriculaIdValor,
    'ID da matrícula inválido.'
  );
  const idUsuario = validarId(usuarioId, 'ID do usuário inválido.');

  const executarTransacao = matriculasRepository.prepararTransacao(() => {
    const matricula =
      matriculasRepository.buscarAtivaPorIdEUsuario(
        matriculaId,
        idUsuario
      );

    if (!matricula) {
      throw new ErroAplicacao('Matrícula não encontrada.', 404);
    }

    const cancelada = matriculasRepository.cancelar(
      matriculaId,
      idUsuario
    );

    if (!cancelada) {
      throw new ErroAplicacao('Matrícula não encontrada.', 404);
    }
  });

  executarTransacao();
}

module.exports = {
  matricular,
  listarMinhas,
  cancelar
};