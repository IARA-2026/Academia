// Camada de rotas: define os caminhos HTTP do recurso de aulas.
// As regras ficam no serviço; esta camada apenas encaminha requisições e respostas.
const express = require('express');
const aulasService = require('../services/aulas.service');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(aulasService.listarTodas());
});

router.get('/:id', (req, res) => {
  res.json(aulasService.buscarPorId(req.params.id));
});

router.post('/', (req, res) => {
  const aula = aulasService.criar(req.body);
  res.status(201).json(aula);
});

router.put('/:id', (req, res) => {
  const aula = aulasService.atualizar(req.params.id, req.body);
  res.status(200).json(aula);
});

router.delete('/:id', (req, res) => {
  aulasService.excluir(req.params.id);
  res.status(204).end();
});

module.exports = router;