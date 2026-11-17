// Camada de aplicação: inicia o servidor HTTP da Academia Fit.
// Nesta etapa, a rota raiz confirma que Node e Express estão funcionando.
const express = require('express');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Academia Fit: servidor funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});