"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("MasonicSessions", "status", {
      type: Sequelize.ENUM("Agendada", "Realizada", "Cancelada"),
      allowNull: false,
      defaultValue: "Agendada",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("MasonicSessions", "status");
  },
};