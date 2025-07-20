'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      'MasonicSessions',
      'dataSessao',
      {
        type: Sequelize.DATE,
        allowNull: false,
      }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      'MasonicSessions',
      'dataSessao',
      {
        type: Sequelize.DATEONLY,
        allowNull: false,
      }
    );
  }
};
