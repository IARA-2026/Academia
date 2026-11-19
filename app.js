// Camada HTTP: inicia o Express e oferece a agenda inicial da academia.
// Nesta etapa, os dados ficam em memória; depois vamos usar o banco de dados.
const express = require('express');

const app = express();
app.use(express.json());
const port = 3000;

const aulas = [
  {
    id: 1,
    modalidade: 'Funcional',
    instrutor: 'Marina',
    horario: '18:00',
    capacidade: 12,
    matriculados: 9
  },
  {
    id: 2,
    modalidade: 'Pilates',
    instrutor: 'Caio',
    horario: '19:00',
    capacidade: 10,
    matriculados: 10
  }
];

// Mantém IDs únicos mesmo quando uma aula é excluída.
let proximoIdAula = aulas.length + 1;

/**
 * Prepara os dados públicos de uma aula e calcula as vagas restantes.
 * @param {object} aula aula armazenada em memória
 * @returns {object} aula com vagas disponíveis
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

/** @returns {Array<object>} lista de aulas com vagas disponíveis */
function listarAulasComVagas() {
  return aulas.map(formatarAulaComVagas);
}

app.get('/', (req, res) => {
  res.send(`Academia Fit: ${aulas.length} aulas na agenda.`);
});

app.get('/api/aulas', (req, res) => {
  res.json(listarAulasComVagas());
});

app.get('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const aula = aulas.find((item) => item.id === id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  return res.json(formatarAulaComVagas(aula));
});

app.post('/api/aulas', (req, res) => {
  const dados = req.body ?? {};

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
    return res.status(400).json({
      erro: 'Informe modalidade, instrutor, horário e capacidade válidos.'
    });
  }

  const novaAula = {
    id: proximoIdAula,
    modalidade,
    instrutor,
    horario,
    capacidade,
    matriculados: 0
  };

  aulas.push(novaAula);
  proximoIdAula += 1;
  return res.status(201).json(formatarAulaComVagas(novaAula));
});

app.put('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const aula = aulas.find((item) => item.id === id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  const dados = req.body ?? {};
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
    return res.status(400).json({ erro: 'Dados da aula inválidos.' });
  }

  // Regra de negócio: a capacidade não pode ficar abaixo das matrículas atuais.
  if (capacidade < aula.matriculados) {
    return res.status(409).json({
      erro: 'A capacidade não pode ser menor que o número de matrículas.'
    });
  }

  aula.modalidade = modalidade;
  aula.instrutor = instrutor;
  aula.horario = horario;
  aula.capacidade = capacidade;

  return res.status(200).json(formatarAulaComVagas(aula));
});

app.delete('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const indice = aulas.findIndex((aula) => aula.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  const aula = aulas[indice];

  // Regra de negócio: aulas com matrículas não podem ser excluídas.
  if (aula.matriculados > 0) {
    return res.status(409).json({
      erro: 'Não é possível excluir uma aula com matrículas.'
    });
  }

  aulas.splice(indice, 1);
  return res.status(204).end();
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});