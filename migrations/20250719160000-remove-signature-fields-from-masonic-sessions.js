
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MasonicSessions', 'statusEdital');
    await queryInterface.removeColumn('MasonicSessions', 'assinaturasEdital');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('MasonicSessions', 'statusEdital', {
      type: Sequelize.ENUM('Rascunho', 'Assinado'),
      defaultValue: 'Rascunho',
      allowNull: false,
    });

    await queryInterface.addColumn('MasonicSessions', 'assinaturasEdital', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
};
