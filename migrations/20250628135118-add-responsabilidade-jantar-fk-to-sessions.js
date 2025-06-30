"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      "MasonicSessions",
      "responsabilidadeJantarId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "ResponsabilidadesJantar",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      "MasonicSessions",
      "responsabilidadeJantarId"
    );
  },
};