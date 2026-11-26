// Camada de rotas: check-in e histórico do aluno autenticado.
const express = require('express');
const checkinsService = require('../services/checkins.service');
const {
  autenticar,
  autorizarPapel
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/',
  autenticar,
  autorizarPapel('aluno'),
  (req, res) => {
    const checkin = checkinsService.registrar(req.usuario.id);
    res.status(201).json(checkin);
  }
);

router.get(
  '/minhas',
  autenticar,
  autorizarPapel('aluno'),
  (req, res) => {
    res.json(checkinsService.listarMeus(req.usuario.id));
  }
);

module.exports = router;