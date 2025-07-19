'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MasonicSessions', 'statusEdital', {
      type: Sequelize.ENUM('Rascunho', 'Assinado'),
      allowNull: false,
      defaultValue: 'Rascunho',
      after: 'caminhoEditalPdf',
    });
    await queryInterface.addColumn('MasonicSessions', 'assinaturasEdital', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'statusEdital',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MasonicSessions', 'statusEdital');
    await queryInterface.removeColumn('MasonicSessions', 'assinaturasEdital');
  }
};