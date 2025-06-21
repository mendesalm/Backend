"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "MasonicSessions",
      "tipoResponsabilidadeJantar",
      {
        type: Sequelize.ENUM(
          "Sequencial",
          "Manual",
          "Compartilhado",
          "Institucional"
        ),
        allowNull: false,
        defaultValue: "Sequencial",
        after: "responsavelJantarLodgeMemberId", // Opcional: posiciona a coluna no banco
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "MasonicSessions",
      "tipoResponsabilidadeJantar"
    );
  },
};
