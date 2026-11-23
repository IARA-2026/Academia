// Middleware de segurança: valida tokens JWT e identifica o usuário da requisição.
// Também restringe o acesso às rotas conforme o papel incluído no token.
const jwt = require('jsonwebtoken');

function criarErro(mensagem, statusCode) {
  const erro = new Error(mensagem);
  erro.statusCode = statusCode;
  return erro;
}

/**
 * Verifica o token Bearer e adiciona o usuário autenticado à requisição.
 */
function autenticar(req, res, next) {
  const cabecalho = req.get('authorization') || '';
  const correspondencia = cabecalho.match(/^Bearer\s+(\S+)$/i);

  if (!correspondencia) {
    return next(criarErro('Token de acesso ausente ou inválido.', 401));
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return next(new Error('JWT_SECRET ausente ou muito curto.'));
  }

  try {
    const payload = jwt.verify(correspondencia[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    const id = Number(payload.sub);
    const papeisValidos = ['aluno', 'admin'];

    if (!Number.isInteger(id) || !papeisValidos.includes(payload.papel)) {
      return next(criarErro('Token de acesso inválido.', 401));
    }

    req.usuario = { id, papel: payload.papel };
    return next();
  } catch {
    return next(criarErro('Token expirado ou inválido.', 401));
  }
}

/**
 * Cria um middleware que permite acesso somente aos papéis indicados.
 *
 * @param {...string} papeisPermitidos papéis autorizados para a rota
 * @returns {Function} middleware de autorização
 */
function autorizarPapel(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(criarErro('É necessário fazer login.', 401));
    }

    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return next(criarErro('Você não tem permissão para esta ação.', 403));
    }

    return next();
  };
}

module.exports = {
  autenticar,
  autorizarPapel
};