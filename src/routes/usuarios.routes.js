// Camada de rotas: define os caminhos HTTP para cadastro e login.
// O serviço aplica as regras e a rota escolhe o status da resposta.
const express = require('express');
const usuariosService = require('../services/usuarios.service');

const router = express.Router();

router.post('/cadastro', async (req, res, next) => {
  try {
    const usuario = await usuariosService.cadastrar(req.body);
    return res.status(201).json(usuario);
  } catch (erro) {
    return next(erro);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const resultado = await usuariosService.entrar(req.body);
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
});

module.exports = router;