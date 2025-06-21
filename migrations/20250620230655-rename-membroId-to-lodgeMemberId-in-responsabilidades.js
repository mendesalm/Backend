"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Renomeia a coluna 'membroId' para 'lodgeMemberId' na tabela 'ResponsabilidadesJantar'
    await queryInterface.renameColumn(
      "ResponsabilidadesJantar",
      "membroId",
      "lodgeMemberId"
    );
  },

  async down(queryInterface, Sequelize) {
    // Reverte a alteração
    await queryInterface.renameColumn(
      "ResponsabilidadesJantar",
      "lodgeMemberId",
      "membroId"
    );
  },
};
