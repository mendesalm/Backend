'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Emprestimos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      livroId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Biblioteca', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      membroId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'LodgeMembers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      dataEmprestimo: { type: Sequelize.DATEONLY, allowNull: false },
      dataDevolucaoPrevista: { type: Sequelize.DATEONLY, allowNull: false },
      dataDevolucaoReal: { type: Sequelize.DATEONLY, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Emprestimos');
  }
};