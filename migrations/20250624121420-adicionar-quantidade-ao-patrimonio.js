// No arquivo de migração recém-criado
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Patrimonios", "quantidade", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1, // Importante: Itens já cadastrados receberão quantidade 1
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Patrimonios", "quantidade");
  },
};
