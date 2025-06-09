'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Comissoes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nome: { type: Sequelize.STRING, allowNull: false, unique: true },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      tipo: { type: Sequelize.ENUM('Permanente', 'Temporária'), allowNull: false },
      dataInicio: { type: Sequelize.DATEONLY, allowNull: false },
      dataFim: { type: Sequelize.DATEONLY, allowNull: false },
      criadorId: {
        type: Sequelize.INTEGER,
        allowNull: true, // <-- ALTERADO AQUI
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Mantém a regra original
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Comissoes');
  }
};