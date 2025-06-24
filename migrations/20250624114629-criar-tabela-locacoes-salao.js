"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("LocacoesSalao", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      dataInicio: { type: Sequelize.DATE, allowNull: false },
      dataFim: { type: Sequelize.DATE, allowNull: false },
      finalidade: { type: Sequelize.TEXT, allowNull: false },
      ehNaoOneroso: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      status: {
        type: Sequelize.ENUM("Pendente", "Confirmado", "Cancelado"),
        allowNull: false,
        defaultValue: "Pendente",
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
    await queryInterface.dropTable("LocacoesSalao");
  },
};
