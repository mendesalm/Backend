// migrations/xxxxxxxx-criar-tabela-avisos.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Avisos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      titulo: { type: Sequelize.STRING, allowNull: false },
      conteudo: { type: Sequelize.TEXT, allowNull: false },
      dataExpiracao: { type: Sequelize.DATEONLY, allowNull: true },
      fixado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autorId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Permitir nulo para manter o aviso se o autor for deletado
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Avisos criada.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Avisos');
    console.log('Tabela Avisos removida.');
  }
};
