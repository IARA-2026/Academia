// Camada de serviços: valida entradas e aplica as regras do recurso de aulas.
// A persistência é delegada ao repositório; esta camada não contém SQL.
const aulasRepository = require('../database/aulas.repository');

class ErroAplicacao extends Error {
  constructor(mensagem, statusCode) {
    super(mensagem);
    this.name = 'ErroAplicacao';
    this.statusCode = statusCode;
  }
}

/**
 * Converte e valida o ID recebido pela API.
 *
 * @param {string|number} valor ID recebido pela rota
 * @returns {number} ID inteiro positivo
 * @throws {ErroAplicacao} 400 se o ID for inválido
 */
function validarId(valor) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id < 1) {
    throw new ErroAplicacao('ID da aula inválido.', 400);
  }

  return id;
}

/**
 * Valida e normaliza os campos editáveis de uma aula.
 *
 * @param {object} dados dados recebidos na requisição
 * @returns {{modalidade: string, instrutor: string, horario: string, capacidade: number}} dados normalizados
 * @throws {ErroAplicacao} 400 se algum campo for inválido
 */
function validarDadosDaAula(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroAplicacao(
      'Informe modalidade, instrutor, horário e capacidade válidos.',
      400
    );
  }

  const modalidade =
    typeof dados.modalidade === 'string' ? dados.modalidade.trim() : '';
  const instrutor =
    typeof dados.instrutor === 'string' ? dados.instrutor.trim() : '';
  const horario =
    typeof dados.horario === 'string' ? dados.horario.trim() : '';
  const capacidade = Number(dados.capacidade);
  const horarioValido = /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario);

  if (
    modalidade.length < 2 ||
    modalidade.length > 60 ||
    instrutor.length < 2 ||
    instrutor.length > 80 ||
    !horarioValido ||
    !Number.isInteger(capacidade) ||
    capacidade < 1 ||
    capacidade > 100
  ) {
    throw new ErroAplicacao(
      'Informe modalidade, instrutor, horário e capacidade válidos.',
      400
    );
  }

  return { modalidade, instrutor, horario, capacidade };
}

/**
 * Calcula as vagas disponíveis para uma aula.
 *
 * @param {object} aula registro retornado pelo repositório
 * @returns {object} dados públicos da aula
 */
function formatarAulaComVagas(aula) {
  return {
    id: aula.id,
    modalidade: aula.modalidade,
    instrutor: aula.instrutor,
    horario: aula.horario,
    capacidade: aula.capacidade,
    matriculados: aula.matriculados,
    vagasDisponiveis: aula.capacidade - aula.matriculados
  };
}

/**
 * Lista as aulas com a quantidade de vagas disponíveis.
 *
 * @returns {object[]} aulas formatadas
 * @throws {Error} se o repositório não conseguir consultar o banco
 */
function listarTodas() {
  return aulasRepository.listarTodas().map(formatarAulaComVagas);
}

/**
 * Retorna a quantidade de aulas cadastradas.
 *
 * @returns {number} quantidade de aulas
 * @throws {Error} se o repositório não conseguir consultar o banco
 */
function contar() {
  return aulasRepository.contar();
}

/**
 * Busca uma aula pelo ID.
 *
 * @param {string|number} valor ID recebido pela rota
 * @returns {object} aula formatada
 * @throws {ErroAplicacao} 400 para ID inválido ou 404 se a aula não existir
 */
function buscarPorId(valor) {
  const id = validarId(valor);
  const aula = aulasRepository.buscarPorId(id);

  if (!aula) {
    throw new ErroAplicacao('Aula não encontrada.', 404);
  }

  return formatarAulaComVagas(aula);
}

/**
 * Cadastra uma aula sem matrículas iniciais.
 *
 * @param {object} dados campos recebidos na requisição
 * @returns {object} aula criada e formatada
 * @throws {ErroAplicacao} 400 se os dados forem inválidos
 * @throws {Error} se o repositório não conseguir gravar no banco
 */
function criar(dados) {
  const dadosValidos = validarDadosDaAula(dados);
  const aula = aulasRepository.criar(dadosValidos);

  return formatarAulaComVagas(aula);
}

/**
 * Atualiza os dados de uma aula existente.
 *
 * @param {string|number} valor ID recebido pela rota
 * @param {object} dados novos campos da aula
 * @returns {object} aula atualizada e formatada
 * @throws {ErroAplicacao} 400 para entrada inválida, 404 se não existir, 409 se a capacidade ficar abaixo das matrículas
 * @throws {Error} se o repositório não conseguir atualizar o banco
 */
function atualizar(valor, dados) {
  const id = validarId(valor);
  const aulaAtual = aulasRepository.buscarPorId(id);

  if (!aulaAtual) {
    throw new ErroAplicacao('Aula não encontrada.', 404);
  }

  const dadosValidos = validarDadosDaAula(dados);

  // Regra de negócio: a capacidade não pode ficar abaixo das matrículas atuais.
  if (dadosValidos.capacidade < aulaAtual.matriculados) {
    throw new ErroAplicacao(
      'A capacidade não pode ser menor que o número de matrículas.',
      409
    );
  }

  aulasRepository.atualizar(id, dadosValidos);
  return formatarAulaComVagas(aulasRepository.buscarPorId(id));
}

/**
 * Exclui uma aula que ainda não tenha matrículas.
 *
 * @param {string|number} valor ID recebido pela rota
 * @returns {void}
 * @throws {ErroAplicacao} 400 para ID inválido, 404 se não existir ou 409 se tiver matrículas
 * @throws {Error} se o repositório não conseguir excluir do banco
 */
function excluir(valor) {
  const id = validarId(valor);
  const aula = aulasRepository.buscarPorId(id);

  if (!aula) {
    throw new ErroAplicacao('Aula não encontrada.', 404);
  }

  // Regra de negócio: uma aula com matrículas não pode ser excluída.
  if (aula.matriculados > 0) {
    throw new ErroAplicacao(
      'Não é possível excluir uma aula com matrículas.',
      409
    );
  }

  if (aulasRepository.contarMatriculas(id) > 0) {
  throw new ErroAplicacao(
    'Não é possível excluir uma aula com histórico de matrículas.',
    409
  );
}

  aulasRepository.excluir(id);
}

module.exports = {
  ErroAplicacao,
  listarTodas,
  contar,
  buscarPorId,
  criar,
  atualizar,
  excluir
};