// Seed de demonstração: carrega aulas e usuários de teste.
// As contas criadas aqui servem para avaliação local do projeto.
const db = require('./db');
const bcrypt = require('bcrypt');

try {
  const totalAulas = db.prepare('SELECT COUNT(*) AS total FROM aulas').get();

  if (totalAulas.total === 0) {
    const inserirAulas = db.prepare(`
      INSERT INTO aulas (modalidade, instrutor, horario, capacidade, matriculados)
      VALUES (?, ?, ?, ?, ?)
    `);

    const carregarAulas = db.transaction(() => {
      inserirAulas.run('Funcional', 'Marina', '18:00', 12, 9);
      inserirAulas.run('Pilates', 'Caio', '19:00', 10, 10);
    });

    carregarAulas();
  }

  const usuariosDemo = [
    {
      nome: 'Administrador',
      email: 'admin@academiafit.local',
      senha: 'Admin@2026',
      papel: 'admin'
    },
    {
      nome: 'Aluno de demonstração',
      email: 'aluno@academiafit.local',
      senha: 'Aluno@2026',
      papel: 'aluno'
    }
  ];

  const buscarUsuario = db.prepare(
    'SELECT id FROM usuarios WHERE email = ?'
  );
  const inserirUsuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, papel)
    VALUES (?, ?, ?, ?)
  `);

  const carregarUsuarios = db.transaction(() => {
    for (const usuario of usuariosDemo) {
      if (!buscarUsuario.get(usuario.email)) {
        const senhaHash = bcrypt.hashSync(usuario.senha, 12);

        inserirUsuario.run(
          usuario.nome,
          usuario.email,
          senhaHash,
          usuario.papel
        );
      }
    }
  });

  carregarUsuarios();
  console.log('Seed concluído. As contas de demonstração estão disponíveis.');
} catch (erro) {
  console.error('Não foi possível carregar os dados de demonstração:', erro);
  process.exitCode = 1;
} finally {
  db.close();
}