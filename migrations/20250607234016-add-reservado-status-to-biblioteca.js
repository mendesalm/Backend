'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Biblioteca', 'status', {
      type: Sequelize.ENUM('Disponível', 'Emprestado', 'Reservado', 'Manutenção', 'Perdido'),
      allowNull: false,
      defaultValue: 'Disponível'
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Reverter para o ENUM anterior
    await queryInterface.changeColumn('Biblioteca', 'status', {
      type: Sequelize.ENUM('Disponível', 'Emprestado', 'Manutenção', 'Perdido'),
      allowNull: false,
      defaultValue: 'Disponível'
    });
  }
};
