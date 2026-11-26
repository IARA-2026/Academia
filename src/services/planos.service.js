// Camada de regras de negócio: atribuição e renovação de planos.
const planosRepository = require('../database/planos.repository');

function criarErro(mensagem, statusCode) {
  const erro = new Error(mensagem);
  erro.statusCode = statusCode;
  return erro;
}

function dataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`);

  return (
    !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
  );
}

function atribuir(usuarioIdInformado, validade) {
  const usuarioId = Number(usuarioIdInformado);

  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    throw criarErro('ID do aluno inválido.', 400);
  }

  if (!dataValida(validade)) {
    throw criarErro('Informe uma data de validade válida no formato AAAA-MM-DD.', 400);
  }

  if (!planosRepository.existeAluno(usuarioId)) {
    throw criarErro('Aluno não encontrado.', 404);
  }

  return planosRepository.salvar(usuarioId, validade);
}

module.exports = {
  atribuir
};