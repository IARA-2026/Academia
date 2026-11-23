// Seed de demonstração: preenche o banco com aulas iniciais.
// Só insere os dados quando a tabela ainda está vazia.
const db = require('./db');

try {
  const resultado = db.prepare('SELECT COUNT(*) AS total FROM aulas').get();

  if (resultado.total === 0) {
    const inserirAulas = db.transaction(() => {
      const inserir = db.prepare(`
        INSERT INTO aulas (modalidade, instrutor, horario, capacidade, matriculados)
        VALUES (?, ?, ?, ?, ?)
      `);

      inserir.run('Funcional', 'Marina', '18:00', 12, 9);
      inserir.run('Pilates', 'Caio', '19:00', 10, 10);
    });

    inserirAulas();
    console.log('Aulas de demonstração cadastradas.');
  } else {
    console.log('O banco já contém aulas; nenhum dado foi inserido.');
  }
} catch (erro) {
  console.error('Não foi possível carregar os dados de demonstração:', erro);
  process.exitCode = 1;
} finally {
  db.close();
}