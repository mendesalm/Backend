"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("MasonicSessions", "numero", {
      type: Sequelize.INTEGER,
      allowNull: true, // Will be populated by the new service
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("MasonicSessions", "numero");
  },
};