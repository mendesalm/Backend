// migrations/xxxxxxxx-criar-tabela-orcamentos.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orcamentos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      ano: { type: Sequelize.INTEGER, allowNull: false },
      valorOrcado: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      contaId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Contas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Se a conta for deletada, o orçamento dela também é.
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // Adiciona uma restrição para garantir que só pode haver um orçamento por conta por ano
    await queryInterface.addConstraint('Orcamentos', {
      fields: ['ano', 'contaId'],
      type: 'unique',
      name: 'unique_orcamento_por_conta_ano'
    });
    console.log('Tabela Orcamentos criada.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orcamentos');
    console.log('Tabela Orcamentos removida.');
  }
};
