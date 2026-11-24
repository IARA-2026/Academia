// Camada de rotas: define os caminhos HTTP do recurso de matrículas.
// O ID do aluno autenticado é obtido do token para impedir acesso a dados alheios.
const express = require('express');
const matriculasService = require('../services/matriculas.service');
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
    const matricula = matriculasService.matricular(
      req.usuario.id,
      req.body?.aulaId
    );

    res.status(201).json(matricula);
  }
);

router.get(
  '/minhas',
  autenticar,
  autorizarPapel('aluno'),
  (req, res) => {
    res.json(matriculasService.listarMinhas(req.usuario.id));
  }
);

router.delete(
  '/:id',
  autenticar,
  autorizarPapel('aluno'),
  (req, res) => {
    matriculasService.cancelar(req.params.id, req.usuario.id);
    res.status(204).end();
  }
);

module.exports = router;