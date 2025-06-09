// migrations/xxxxxxxx-criar-tabelas-financeiro.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabela Contas (Plano de Contas)
    await queryInterface.createTable('Contas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nome: { type: Sequelize.STRING, allowNull: false, unique: true },
      tipo: { type: Sequelize.ENUM('Receita', 'Despesa'), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Contas criada.');

    // Tabela Lancamentos
    await queryInterface.createTable('Lancamentos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      descricao: { type: Sequelize.STRING, allowNull: false },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      dataLancamento: { type: Sequelize.DATEONLY, allowNull: false },
      comprovanteUrl: { type: Sequelize.STRING, allowNull: true },
      contaId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Contas', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT' // Impede deletar conta com lançamentos
      },
      membroId: { // Membro relacionado à transação (ex: quem pagou)
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      criadoPorId: { // Usuário que registrou (auditoria)
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Lancamentos criada.');
  },

  async down(queryInterface, Sequelize) {
    // A ordem de remoção é o inverso da criação
    await queryInterface.dropTable('Lancamentos');
    console.log('Tabela Lancamentos removida.');
    await queryInterface.dropTable('Contas');
    console.log('Tabela Contas removida.');
  }
};