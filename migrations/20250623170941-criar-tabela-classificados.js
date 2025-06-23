"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Classificados", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      tipoAnuncio: {
        type: Sequelize.ENUM("Venda", "Compra", "Aluguel", "Doação", "Serviço"),
        allowNull: false,
      },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      contato: { type: Sequelize.STRING, allowNull: true },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "LodgeMembers", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Classificados");
  },
};
