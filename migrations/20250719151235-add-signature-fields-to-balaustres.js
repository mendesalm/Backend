'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Balaustres', 'status', {
      type: Sequelize.ENUM('Rascunho', 'Assinado'),
      allowNull: false,
      defaultValue: 'Rascunho',
      after: 'ano',
    });
    await queryInterface.addColumn('Balaustres', 'assinaturas', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'status',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Balaustres', 'status');
    await queryInterface.removeColumn('Balaustres', 'assinaturas');
  }
};