// Camada de rotas: operações administrativas de planos.
const express = require('express');
const planosService = require('../services/planos.service');
const {
  autenticar,
  autorizarPapel
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.put(
  '/:usuarioId',
  autenticar,
  autorizarPapel('admin'),
  (req, res) => {
    const plano = planosService.atribuir(
      req.params.usuarioId,
      req.body?.validade
    );

    res.json(plano);
  }
);

module.exports = router;
