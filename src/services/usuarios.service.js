// Camada de serviços: valida usuários, protege senhas e emite tokens de acesso.
// O repositório cuida das consultas; nenhum SQL fica neste arquivo.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../database/usuarios.repository');

class ErroAplicacao extends Error {
  constructor(mensagem, statusCode) {
    super(mensagem);
    this.name = 'ErroAplicacao';
    this.statusCode = statusCode;
  }
}

/**
 * Valida os dados do cadastro e normaliza os campos textuais.
 *
 * @param {object} dados dados recebidos na requisição
 * @returns {{nome: string, email: string, senha: string}} dados normalizados
 * @throws {ErroAplicacao} 400 se os campos forem inválidos
 */
function validarCadastro(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroAplicacao('Informe nome, e-mail e senha válidos.', 400);
  }

  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
  const email =
    typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
  const senha = typeof dados.senha === 'string' ? dados.senha : '';
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const tamanhoSenha = Buffer.byteLength(senha, 'utf8');

  if (
    nome.length < 2 ||
    nome.length > 80 ||
    !emailValido ||
    senha.length < 8 ||
    tamanhoSenha > 72
  ) {
    throw new ErroAplicacao(
      'Informe nome, e-mail válido e senha de 8 a 72 bytes.',
      400
    );
  }

  return { nome, email, senha };
}

/**
 * Monta a representação pública do usuário, sem incluir o hash da senha.
 *
 * @param {object} usuario registro obtido do repositório
 * @returns {{id: number, nome: string, email: string, papel: string}} dados públicos
 */
function formatarUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel
  };
}

/**
 * Obtém o segredo JWT da configuração local.
 *
 * @returns {string} segredo usado para assinar tokens
 * @throws {Error} se JWT_SECRET não estiver configurado
 */
function obterSegredoJwt() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET ausente ou muito curto.');
  }

  return process.env.JWT_SECRET;
}

/**
 * Cadastra um aluno com a senha protegida por bcrypt.
 *
 * @param {object} dados dados recebidos na requisição
 * @returns {{id: number, nome: string, email: string, papel: string}} usuário criado
 * @throws {ErroAplicacao} 400 para dados inválidos ou 409 se o e-mail já estiver cadastrado
 * @throws {Error} se ocorrer falha no hash ou no banco de dados
 */
async function cadastrar(dados) {
  const cadastro = validarCadastro(dados);

  if (usuariosRepository.buscarPorEmail(cadastro.email)) {
    throw new ErroAplicacao('Este e-mail já está cadastrado.', 409);
  }

  const senhaHash = await bcrypt.hash(cadastro.senha, 12);

  try {
    const usuario = usuariosRepository.criar({
      nome: cadastro.nome,
      email: cadastro.email,
      senhaHash,
      papel: 'aluno'
    });

    return formatarUsuario(usuario);
  } catch (erro) {
    // UNIQUE no banco também impede duplicidade em cadastros simultâneos.
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new ErroAplicacao('Este e-mail já está cadastrado.', 409);
    }

    throw erro;
  }
}

/**
 * Confere as credenciais e emite um JWT com ID e papel do usuário.
 *
 * @param {object} dados e-mail e senha recebidos na requisição
 * @returns {{token: string, usuario: object}} token e dados públicos
 * @throws {ErroAplicacao} 400 para entrada inválida ou 401 para credenciais incorretas
 * @throws {Error} se JWT_SECRET não estiver configurado ou ocorrer falha interna
 */
async function entrar(dados) {
  const email =
    dados && typeof dados.email === 'string'
      ? dados.email.trim().toLowerCase()
      : '';
  const senha = dados && typeof dados.senha === 'string' ? dados.senha : '';
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailValido || senha.length === 0 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new ErroAplicacao('Informe e-mail e senha válidos.', 400);
  }

  const usuario = usuariosRepository.buscarPorEmail(email);
  const senhaConfere =
    usuario && (await bcrypt.compare(senha, usuario.senha_hash));

  if (!senhaConfere) {
    throw new ErroAplicacao('E-mail ou senha inválidos.', 401);
  }

  const token = jwt.sign(
    { papel: usuario.papel },
    obterSegredoJwt(),
    {
      subject: String(usuario.id),
      expiresIn: '1h',
      algorithm: 'HS256'
    }
  );

  return {
    token,
    usuario: formatarUsuario(usuario)
  };
}

module.exports = {
  cadastrar,
  entrar
};