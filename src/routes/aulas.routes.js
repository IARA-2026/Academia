// Camada de rotas: define os caminhos HTTP do recurso de aulas.
// Alterações na agenda exigem autenticação e papel de administrador.
const express = require('express');
const aulasService = require('../services/aulas.service');
const {
  autenticar,
  autorizarPapel
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(aulasService.listarTodas());
});

router.get('/:id', (req, res) => {
  res.json(aulasService.buscarPorId(req.params.id));
});

router.post(
  '/',
  autenticar,
  autorizarPapel('admin'),
  (req, res) => {
    const aula = aulasService.criar(req.body);
    res.status(201).json(aula);
  }
);

router.put(
  '/:id',
  autenticar,
  autorizarPapel('admin'),
  (req, res) => {
    const aula = aulasService.atualizar(req.params.id, req.body);
    res.status(200).json(aula);
  }
);

router.delete(
  '/:id',
  autenticar,
  autorizarPapel('admin'),
  (req, res) => {
    aulasService.excluir(req.params.id);
    res.status(204).end();
  }
);

module.exports = router;