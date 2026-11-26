// Camada de regras de negócio: valida o plano antes do check-in.
const planosRepository = require('../database/planos.repository');
const checkinsRepository = require('../database/checkins.repository');

function criarErro(mensagem, statusCode) {
  const erro = new Error(mensagem);
  erro.statusCode = statusCode;
  return erro;
}

function obterDataAtual() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== 'literal')
      .map((parte) => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function registrar(usuarioId) {
  const hoje = obterDataAtual();
  const plano = planosRepository.buscarPorUsuario(usuarioId);

  if (!plano) {
    throw criarErro('Aluno não possui plano cadastrado.', 403);
  }

  if (plano.validade < hoje) {
    throw criarErro('Plano vencido. Check-in não permitido.', 403);
  }

  const checkin = checkinsRepository.registrarSePlanoValido(
    usuarioId,
    hoje
  );

  if (!checkin) {
    throw criarErro('Plano vencido. Check-in não permitido.', 403);
  }

  return checkin;
}

function listarMeus(usuarioId) {
  return checkinsRepository.listarPorUsuario(usuarioId);
}

module.exports = {
  registrar,
  listarMeus
};