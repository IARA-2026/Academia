// Camada HTTP: inicia o Express e oferece a agenda inicial da academia.
// Nesta etapa, os dados ficam em memória; depois vamos usar o banco de dados.
const express = require('express');

const app = express();
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

/**
 * Calcula as vagas restantes sem modificar a lista de aulas.
 * @returns {Array<object>} aulas com o total de vagas disponíveis
 */
function listarAulasComVagas() {
  return aulas.map((aula) => ({
    id: aula.id,
    modalidade: aula.modalidade,
    instrutor: aula.instrutor,
    horario: aula.horario,
    capacidade: aula.capacidade,
    matriculados: aula.matriculados,
    vagasDisponiveis: aula.capacidade - aula.matriculados
  }));
}

app.get('/', (req, res) => {
  res.send(`Academia Fit: ${aulas.length} aulas na agenda.`);
});

app.get('/api/aulas', (req, res) => {
  res.json(listarAulasComVagas());
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});