// No arquivo de migração recém-criado
"use strict";

const statusAntigo = ["Pendente", "Confirmado", "Cancelado"];
const statusNovo = ["Pendente", "Confirmado", "Cancelado", "Concluído"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Altera a coluna para incluir o novo status.
    // Nota: A alteração de ENUMs pode variar entre diferentes bancos de dados (PostgreSQL, MySQL, etc.)
    // Esta abordagem é geralmente compatível.
    await queryInterface.changeColumn("LocacoesSalao", "status", {
      type: Sequelize.ENUM(...statusNovo),
      allowNull: false,
      defaultValue: "Pendente",
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte a coluna para a lista de status antiga
    await queryInterface.changeColumn("LocacoesSalao", "status", {
      type: Sequelize.ENUM(...statusAntigo),
      allowNull: false,
      defaultValue: "Pendente",
    });
  },
};
