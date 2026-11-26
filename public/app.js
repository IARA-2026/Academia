// Camada de interface: conecta as telas da Academia Fit à API.
// Os dados recebidos são exibidos com textContent, sem interpretar HTML.
const formLogin = document.querySelector('#form-login');
const formCadastro = document.querySelector('#form-cadastro');
const areaAutenticacao = document.querySelector('#area-autenticacao');
const areaAplicacao = document.querySelector('#area-aplicacao');
const tituloAutenticacao = document.querySelector('#titulo-autenticacao');
const mensagemAutenticacao = document.querySelector('#mensagem-autenticacao');
const sessaoUsuario = document.querySelector('#sessao-usuario');
const botaoSair = document.querySelector('#botao-sair');
const botaoMostrarCadastro = document.querySelector('#botao-mostrar-cadastro');
const botaoMostrarLogin = document.querySelector('#botao-mostrar-login');

const areaAdministracao = document.querySelector('#area-administracao');
const formAula = document.querySelector('#form-aula');
const mensagemAula = document.querySelector('#mensagem-aula');
const botaoSalvarAula = document.querySelector('#botao-salvar-aula');
const botaoCancelarEdicao = document.querySelector('#botao-cancelar-edicao');

const estadoAulas = document.querySelector('#estado-aulas');
const listaAulas = document.querySelector('#lista-aulas');
const areaMatriculas = document.querySelector('#area-matriculas');
const estadoMatriculas = document.querySelector('#estado-matriculas');
const listaMatriculas = document.querySelector('#lista-matriculas');

const areaCheckin = document.querySelector('#area-checkin');
const estadoCheckin = document.querySelector('#estado-checkin');
const listaCheckins = document.querySelector('#lista-checkins');
const botaoCheckin = document.querySelector('#botao-checkin');

const areaPlanos = document.querySelector('#area-planos');
const formPlano = document.querySelector('#form-plano');
const mensagemPlano = document.querySelector('#mensagem-plano');

let token = sessionStorage.getItem('academiaToken');
let usuario = null;
let aulasMatriculadas = new Set();

try {
  usuario = JSON.parse(sessionStorage.getItem('academiaUsuario'));
} catch {
  sessionStorage.removeItem('academiaUsuario');
}

if (!token || !usuario) {
  token = null;
  usuario = null;
  sessionStorage.removeItem('academiaToken');
  sessionStorage.removeItem('academiaUsuario');
}

/**
 * Envia uma requisição à API e transforma respostas de erro em mensagens.
 */
async function requisitarApi(
  url,
  { method = 'GET', body, usarToken = true } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (usarToken && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(
      dados?.erro || 'Não foi possível concluir a solicitação.'
    );
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

/**
 * Exibe uma mensagem sem interpretar o texto como HTML.
 */
function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.classList.remove('mensagem-erro', 'mensagem-sucesso');

  if (tipo) {
    elemento.classList.add(tipo);
  }
}

function mostrarFormularioAutenticacao(modo) {
  const cadastroVisivel = modo === 'cadastro';

  formLogin.hidden = cadastroVisivel;
  formCadastro.hidden = !cadastroVisivel;
  botaoMostrarCadastro.hidden = cadastroVisivel;
  botaoMostrarLogin.hidden = !cadastroVisivel;

  tituloAutenticacao.textContent = cadastroVisivel
    ? 'Criar conta'
    : 'Entrar';

  mostrarMensagem(mensagemAutenticacao, '', null);
}

function atualizarInterface() {
  const autenticado = Boolean(token && usuario);

  areaAutenticacao.hidden = autenticado;
  areaAplicacao.hidden = !autenticado;
  botaoSair.hidden = !autenticado;

  areaAdministracao.hidden =
    !autenticado || usuario.papel !== 'admin';
  areaMatriculas.hidden =
    !autenticado || usuario.papel !== 'aluno';
  areaCheckin.hidden =
    !autenticado || usuario.papel !== 'aluno';
  areaPlanos.hidden =
    !autenticado || usuario.papel !== 'admin';

  sessaoUsuario.textContent = autenticado
    ? `Olá, ${usuario.nome} (${usuario.papel})`
    : '';

  if (autenticado) {
    if (usuario.papel === 'aluno') {
      carregarMinhasMatriculas().then(carregarAulas);
      carregarMeusCheckins();
    } else {
      carregarAulas();
    }
  }
}

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botao = formLogin.querySelector('button[type="submit"]');
  if (botao.disabled) return;

  botao.disabled = true;
  mostrarMensagem(mensagemAutenticacao, 'Entrando...', null);

  try {
    const resposta = await requisitarApi('/api/usuarios/login', {
      method: 'POST',
      usarToken: false,
      body: {
        email: formLogin.elements.email.value,
        senha: formLogin.elements.senha.value
      }
    });

    token = resposta.token;
    usuario = resposta.usuario;

    sessionStorage.setItem('academiaToken', token);
    sessionStorage.setItem('academiaUsuario', JSON.stringify(usuario));

    formLogin.reset();
    atualizarInterface();
  } catch (erro) {
    mostrarMensagem(mensagemAutenticacao, erro.message, 'mensagem-erro');
  } finally {
    botao.disabled = false;
  }
});

formCadastro.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botao = formCadastro.querySelector('button[type="submit"]');
  if (botao.disabled) return;

  botao.disabled = true;
  mostrarMensagem(mensagemAutenticacao, 'Criando sua conta...', null);

  const cadastro = {
    nome: formCadastro.elements.nome.value,
    email: formCadastro.elements.email.value,
    senha: formCadastro.elements.senha.value
  };

  try {
    await requisitarApi('/api/usuarios/cadastro', {
      method: 'POST',
      usarToken: false,
      body: cadastro
    });

    formCadastro.reset();
    formLogin.elements.email.value = cadastro.email;
    mostrarFormularioAutenticacao('login');

    mostrarMensagem(
      mensagemAutenticacao,
      'Conta criada. Agora entre com seu e-mail e senha.',
      'mensagem-sucesso'
    );
  } catch (erro) {
    mostrarMensagem(mensagemAutenticacao, erro.message, 'mensagem-erro');
  } finally {
    botao.disabled = false;
  }
});

botaoMostrarCadastro.addEventListener('click', () => {
  mostrarFormularioAutenticacao('cadastro');
});

botaoMostrarLogin.addEventListener('click', () => {
  mostrarFormularioAutenticacao('login');
});

botaoSair.addEventListener('click', () => {
  sessionStorage.removeItem('academiaToken');
  sessionStorage.removeItem('academiaUsuario');

  token = null;
  usuario = null;
  aulasMatriculadas = new Set();

  mostrarFormularioAutenticacao('login');
  atualizarInterface();
});

async function carregarAulas() {
  mostrarMensagem(estadoAulas, 'Carregando agenda...', null);
  listaAulas.replaceChildren();

  try {
    const aulas = await requisitarApi('/api/aulas');

    if (aulas.length === 0) {
      mostrarMensagem(
        estadoAulas,
        'Nenhuma aula disponível no momento.',
        null
      );
      return;
    }

    mostrarMensagem(
      estadoAulas,
      `${aulas.length} aulas encontradas.`,
      'mensagem-sucesso'
    );

    for (const aula of aulas) {
      const cartao = document.createElement('article');
      cartao.className = 'cartao-aula';

      const titulo = document.createElement('h3');
      titulo.textContent = aula.modalidade;

      const instrutor = document.createElement('p');
      instrutor.textContent = `Instrutor: ${aula.instrutor}`;

      const horario = document.createElement('p');
      horario.textContent = `Horário: ${aula.horario}`;

      const vagas = document.createElement('p');
      vagas.textContent =
        `Vagas: ${aula.vagasDisponiveis} de ${aula.capacidade}`;

      cartao.append(titulo, instrutor, horario, vagas);

      if (usuario.papel === 'admin') {
        const botaoEditar = document.createElement('button');
        botaoEditar.type = 'button';
        botaoEditar.className = 'botao-secundario';
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', () => {
          iniciarEdicaoAula(aula);
        });

        const botaoExcluir = document.createElement('button');
        botaoExcluir.type = 'button';
        botaoExcluir.className = 'botao-secundario';
        botaoExcluir.textContent = 'Excluir';
        botaoExcluir.addEventListener('click', () => {
          excluirAula(aula.id, botaoExcluir);
        });

        cartao.append(botaoEditar, botaoExcluir);
      }

      if (usuario.papel === 'aluno') {
        const botaoMatricula = document.createElement('button');
        botaoMatricula.type = 'button';

        const jaMatriculado = aulasMatriculadas.has(aula.id);

        if (jaMatriculado) {
          botaoMatricula.textContent = 'Matriculado';
        } else if (aula.vagasDisponiveis > 0) {
          botaoMatricula.textContent = 'Matricular-se';
        } else {
          botaoMatricula.textContent = 'Aula lotada';
        }

        botaoMatricula.disabled =
          jaMatriculado || aula.vagasDisponiveis <= 0;

        botaoMatricula.addEventListener('click', () => {
          matricularNaAula(aula.id, botaoMatricula);
        });

        cartao.append(botaoMatricula);
      }

      listaAulas.append(cartao);
    }
  } catch (erro) {
    mostrarMensagem(estadoAulas, erro.message, 'mensagem-erro');
  }
}

async function carregarMinhasMatriculas() {
  mostrarMensagem(estadoMatriculas, 'Carregando matrículas...', null);
  listaMatriculas.replaceChildren();

  try {
    const matriculas = await requisitarApi('/api/matriculas/minhas');

    aulasMatriculadas = new Set(
      matriculas.map((matricula) => matricula.aula.id)
    );

    if (matriculas.length === 0) {
      mostrarMensagem(
        estadoMatriculas,
        'Você ainda não tem matrículas.',
        null
      );
      return;
    }

    mostrarMensagem(
      estadoMatriculas,
      `${matriculas.length} matrículas ativas.`,
      'mensagem-sucesso'
    );

    for (const matricula of matriculas) {
      const cartao = document.createElement('article');
      cartao.className = 'cartao-matricula';

      const titulo = document.createElement('h3');
      titulo.textContent = matricula.aula.modalidade;

      const horario = document.createElement('p');
      horario.textContent = `Horário: ${matricula.aula.horario}`;

      const instrutor = document.createElement('p');
      instrutor.textContent = `Instrutor: ${matricula.aula.instrutor}`;

      const botaoCancelar = document.createElement('button');
      botaoCancelar.type = 'button';
      botaoCancelar.className = 'botao-secundario';
      botaoCancelar.textContent = 'Cancelar matrícula';
      botaoCancelar.addEventListener('click', () => {
        cancelarMatricula(matricula.id, botaoCancelar);
      });

      cartao.append(titulo, horario, instrutor, botaoCancelar);
      listaMatriculas.append(cartao);
    }
  } catch (erro) {
    mostrarMensagem(estadoMatriculas, erro.message, 'mensagem-erro');
  }
}

async function carregarMeusCheckins() {
  mostrarMensagem(estadoCheckin, 'Carregando histórico...', null);
  listaCheckins.replaceChildren();

  try {
    const checkins = await requisitarApi('/api/checkins/minhas');

    if (checkins.length === 0) {
      mostrarMensagem(
        estadoCheckin,
        'Você ainda não possui check-ins.',
        null
      );
      return;
    }

    mostrarMensagem(
      estadoCheckin,
      `${checkins.length} entradas registradas.`,
      'mensagem-sucesso'
    );

    for (const checkin of checkins) {
      const cartao = document.createElement('article');
      cartao.className = 'cartao-matricula';

      const titulo = document.createElement('h3');
      titulo.textContent = 'Entrada registrada';

      const data = document.createElement('p');
      data.textContent = `Data e hora: ${checkin.realizado_em}`;

      const validade = document.createElement('p');
      validade.textContent =
        `Plano válido até: ${checkin.validade_plano}`;

      cartao.append(titulo, data, validade);
      listaCheckins.append(cartao);
    }
  } catch (erro) {
    mostrarMensagem(estadoCheckin, erro.message, 'mensagem-erro');
  }
}

async function matricularNaAula(aulaId, botao) {
  botao.disabled = true;
  mostrarMensagem(estadoMatriculas, 'Processando matrícula...', null);

  try {
    await requisitarApi('/api/matriculas', {
      method: 'POST',
      body: { aulaId }
    });

    mostrarMensagem(
      estadoMatriculas,
      'Matrícula realizada com sucesso.',
      'mensagem-sucesso'
    );

    await carregarMinhasMatriculas();
    await carregarAulas();
  } catch (erro) {
    mostrarMensagem(estadoMatriculas, erro.message, 'mensagem-erro');
    botao.disabled = false;
  }
}

async function cancelarMatricula(matriculaId, botao) {
  if (!window.confirm('Deseja cancelar esta matrícula?')) return;

  botao.disabled = true;
  mostrarMensagem(estadoMatriculas, 'Cancelando matrícula...', null);

  try {
    await requisitarApi(`/api/matriculas/${matriculaId}`, {
      method: 'DELETE'
    });

    mostrarMensagem(
      estadoMatriculas,
      'Matrícula cancelada.',
      'mensagem-sucesso'
    );

    await carregarMinhasMatriculas();
    await carregarAulas();
  } catch (erro) {
    mostrarMensagem(estadoMatriculas, erro.message, 'mensagem-erro');
    botao.disabled = false;
  }
}

function iniciarEdicaoAula(aula) {
  document.querySelector('#aula-id').value = aula.id;
  document.querySelector('#aula-modalidade').value = aula.modalidade;
  document.querySelector('#aula-instrutor').value = aula.instrutor;
  document.querySelector('#aula-horario').value = aula.horario;
  document.querySelector('#aula-capacidade').value = aula.capacidade;

  botaoSalvarAula.textContent = 'Salvar alterações';
  botaoCancelarEdicao.hidden = false;
  formAula.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function limparFormularioAula() {
  formAula.reset();
  document.querySelector('#aula-id').value = '';
  botaoSalvarAula.textContent = 'Cadastrar aula';
  botaoCancelarEdicao.hidden = true;
}

botaoCancelarEdicao.addEventListener('click', limparFormularioAula);

formAula.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (botaoSalvarAula.disabled) return;

  const id = document.querySelector('#aula-id').value;
  const dados = {
    modalidade: formAula.elements.modalidade.value,
    instrutor: formAula.elements.instrutor.value,
    horario: formAula.elements.horario.value,
    capacidade: Number(formAula.elements.capacidade.value)
  };

  botaoSalvarAula.disabled = true;
  mostrarMensagem(mensagemAula, 'Salvando aula...', null);

  try {
    await requisitarApi(id ? `/api/aulas/${id}` : '/api/aulas', {
      method: id ? 'PUT' : 'POST',
      body: dados
    });

    limparFormularioAula();
    mostrarMensagem(
      mensagemAula,
      'Aula salva com sucesso.',
      'mensagem-sucesso'
    );
    await carregarAulas();
  } catch (erro) {
    mostrarMensagem(mensagemAula, erro.message, 'mensagem-erro');
  } finally {
    botaoSalvarAula.disabled = false;
  }
});

async function excluirAula(id, botao) {
  if (!window.confirm('Deseja excluir esta aula?')) return;

  botao.disabled = true;
  mostrarMensagem(mensagemAula, 'Excluindo aula...', null);

  try {
    await requisitarApi(`/api/aulas/${id}`, { method: 'DELETE' });

    mostrarMensagem(mensagemAula, 'Aula excluída.', 'mensagem-sucesso');
    await carregarAulas();
  } catch (erro) {
    mostrarMensagem(mensagemAula, erro.message, 'mensagem-erro');
  } finally {
    botao.disabled = false;
  }
}

botaoCheckin.addEventListener('click', async () => {
  if (botaoCheckin.disabled) return;

  botaoCheckin.disabled = true;
  mostrarMensagem(estadoCheckin, 'Verificando seu plano...', null);

  try {
    await requisitarApi('/api/checkins', {
      method: 'POST'
    });

    mostrarMensagem(
      estadoCheckin,
      'Check-in registrado com sucesso.',
      'mensagem-sucesso'
    );

    await carregarMeusCheckins();
  } catch (erro) {
    mostrarMensagem(estadoCheckin, erro.message, 'mensagem-erro');
  } finally {
    botaoCheckin.disabled = false;
  }
});

formPlano.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botao = formPlano.querySelector('button[type="submit"]');
  if (botao.disabled) return;

  const usuarioId = formPlano.elements.usuarioId.value;
  const validade = formPlano.elements.validade.value;

  botao.disabled = true;
  mostrarMensagem(mensagemPlano, 'Salvando plano...', null);

  try {
    const plano = await requisitarApi(
      `/api/planos/${encodeURIComponent(usuarioId)}`,
      {
        method: 'PUT',
        body: { validade }
      }
    );

    mostrarMensagem(
      mensagemPlano,
      `Plano do aluno ${plano.usuario_id} válido até ${plano.validade}.`,
      'mensagem-sucesso'
    );

    formPlano.reset();
  } catch (erro) {
    mostrarMensagem(mensagemPlano, erro.message, 'mensagem-erro');
  } finally {
    botao.disabled = false;
  }
});

document.querySelectorAll('.botao-visualizar-senha').forEach((botao) => {
  botao.addEventListener('click', () => {
    const campo = document.getElementById(botao.dataset.alvo);
    if (!campo) return;

    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    botao.setAttribute('aria-pressed', String(mostrar));
    botao.setAttribute(
      'aria-label',
      mostrar ? 'Ocultar senha' : 'Mostrar senha'
    );
    botao.title = mostrar ? 'Ocultar senha' : 'Mostrar senha';
  });
});

atualizarInterface();