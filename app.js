// Camada HTTP da Academia Fit. Os dados das aulas são salvos no SQLite.
const express = require('express');
const db = require('./src/database/db');

const app = express();
const port = 3000;

app.use(express.json());

// Inclui aulas iniciais apenas quando o banco ainda não tem nenhuma.
const totalAulas = db.prepare('SELECT COUNT(*) AS total FROM aulas').get();

if (totalAulas.total === 0) {
  const inserirAula = db.prepare(`
    INSERT INTO aulas (modalidade, instrutor, horario, capacidade, matriculados)
    VALUES (?, ?, ?, ?, ?)
  `);

  const inserirAulasIniciais = db.transaction(() => {
    inserirAula.run('Funcional', 'Marina', '18:00', 12, 9);
    inserirAula.run('Pilates', 'Caio', '19:00', 10, 10);
  });

  inserirAulasIniciais();
}

/**
 * Prepara os dados públicos de uma aula e calcula as vagas restantes.
 * @param {object} aula aula armazenada no banco
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

function listarAulasComVagas() {
  const aulas = db.prepare('SELECT * FROM aulas ORDER BY id').all();
  return aulas.map(formatarAulaComVagas);
}

function dadosDaAulaSaoValidos(dados) {
  const modalidade =
    typeof dados.modalidade === 'string' ? dados.modalidade.trim() : '';
  const instrutor =
    typeof dados.instrutor === 'string' ? dados.instrutor.trim() : '';
  const horario =
    typeof dados.horario === 'string' ? dados.horario.trim() : '';
  const capacidade = Number(dados.capacidade);
  const horarioValido = /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario);

  return (
    modalidade.length >= 2 &&
    modalidade.length <= 60 &&
    instrutor.length >= 2 &&
    instrutor.length <= 80 &&
    horarioValido &&
    Number.isInteger(capacidade) &&
    capacidade >= 1 &&
    capacidade <= 100
  );
}

function obterDadosValidados(dados) {
  return {
    modalidade: dados.modalidade.trim(),
    instrutor: dados.instrutor.trim(),
    horario: dados.horario.trim(),
    capacidade: Number(dados.capacidade)
  };
}

app.get('/', (req, res) => {
  const resultado = db.prepare('SELECT COUNT(*) AS total FROM aulas').get();
  res.send(`Academia Fit: ${resultado.total} aulas na agenda.`);
});

app.get('/api/aulas', (req, res) => {
  res.json(listarAulasComVagas());
});

app.get('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const aula = db.prepare('SELECT * FROM aulas WHERE id = ?').get(id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  return res.json(formatarAulaComVagas(aula));
});

app.post('/api/aulas', (req, res) => {
  const dados = req.body ?? {};

  if (!dadosDaAulaSaoValidos(dados)) {
    return res.status(400).json({
      erro: 'Informe modalidade, instrutor, horário e capacidade válidos.'
    });
  }

  const aulaValidada = obterDadosValidados(dados);

  const resultado = db.prepare(`
    INSERT INTO aulas (modalidade, instrutor, horario, capacidade, matriculados)
    VALUES (?, ?, ?, ?, 0)
  `).run(
    aulaValidada.modalidade,
    aulaValidada.instrutor,
    aulaValidada.horario,
    aulaValidada.capacidade
  );

  const novaAula = db
    .prepare('SELECT * FROM aulas WHERE id = ?')
    .get(resultado.lastInsertRowid);

  return res.status(201).json(formatarAulaComVagas(novaAula));
});

app.put('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const aula = db.prepare('SELECT * FROM aulas WHERE id = ?').get(id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  const dados = req.body ?? {};

  if (!dadosDaAulaSaoValidos(dados)) {
    return res.status(400).json({ erro: 'Dados da aula inválidos.' });
  }

  const aulaValidada = obterDadosValidados(dados);

  if (aulaValidada.capacidade < aula.matriculados) {
    return res.status(409).json({
      erro: 'A capacidade não pode ser menor que o número de matrículas.'
    });
  }

  db.prepare(`
    UPDATE aulas
    SET modalidade = ?, instrutor = ?, horario = ?, capacidade = ?
    WHERE id = ?
  `).run(
    aulaValidada.modalidade,
    aulaValidada.instrutor,
    aulaValidada.horario,
    aulaValidada.capacidade,
    id
  );

  const aulaAtualizada = db
    .prepare('SELECT * FROM aulas WHERE id = ?')
    .get(id);

  return res.status(200).json(formatarAulaComVagas(aulaAtualizada));
});

app.delete('/api/aulas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: 'ID da aula inválido.' });
  }

  const aula = db.prepare('SELECT * FROM aulas WHERE id = ?').get(id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada.' });
  }

  if (aula.matriculados > 0) {
    return res.status(409).json({
      erro: 'Não é possível excluir uma aula com matrículas.'
    });
  }

  db.prepare('DELETE FROM aulas WHERE id = ?').run(id);
  return res.status(204).end();
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});