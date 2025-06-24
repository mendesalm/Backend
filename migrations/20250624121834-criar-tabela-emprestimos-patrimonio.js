"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EmprestimosPatrimonio", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      dataRetirada: { type: Sequelize.DATE, allowNull: false },
      dataDevolucaoPrevista: { type: Sequelize.DATE, allowNull: false },
      dataDevolucaoReal: { type: Sequelize.DATE, allowNull: true },
      finalidade: { type: Sequelize.TEXT, allowNull: true },
      ehNaoOneroso: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      valorCobrado: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      status: {
        type: Sequelize.ENUM(
          "Solicitado",
          "Aprovado",
          "Retirado",
          "Devolvido",
          "Cancelado"
        ),
        allowNull: false,
        defaultValue: "Solicitado",
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "LodgeMembers", key: "id" },
        onDelete: "SET NULL",
      },
      nomeLocatarioExterno: { type: Sequelize.STRING, allowNull: true },
      contatoLocatarioExterno: { type: Sequelize.STRING, allowNull: true },
      lancamentoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Lancamentos", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("EmprestimosPatrimonio");
  },
};
