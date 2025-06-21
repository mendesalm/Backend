"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "ResponsabilidadesJantar", // Nome da tabela
      "lodgeMemberId", // Nome da nova coluna
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "LodgeMembers", // Tabela para a qual a chave estrangeira aponta
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Se um membro for deletado, ele também é removido da escala.
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "ResponsabilidadesJantar",
      "lodgeMemberId"
    );
  },
};
