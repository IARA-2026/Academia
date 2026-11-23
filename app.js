// Camada HTTP: configura o Express e conecta as rotas da aplicação.
// O tratamento centralizado converte erros dos serviços em respostas HTTP.
require('dotenv').config();
const express = require('express');
const aulasService = require('./src/services/aulas.service');
const aulasRouter = require('./src/routes/aulas.routes');
const usuariosRouter = require('./src/routes/usuarios.routes');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  const total = aulasService.contar();
  res.send(`Academia Fit: ${total} aulas na agenda.`);
});

app.use('/api/aulas', aulasRouter);
app.use('/api/usuarios', usuariosRouter);

// Middleware próprio: centraliza os erros e evita expor detalhes internos do servidor.
app.use((erro, req, res, next) => {
  if (res.headersSent) {
    return next(erro);
  }

  console.error(erro);

  const statusCode = erro.statusCode || 500;
  const mensagem =
    statusCode === 500 ? 'Erro interno do servidor.' : erro.message;

  return res.status(statusCode).json({ erro: mensagem });
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});