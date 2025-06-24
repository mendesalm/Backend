"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ItensEmprestimoPatrimonio", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      emprestimoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "EmprestimosPatrimonio", key: "id" },
        onDelete: "CASCADE",
      },
      patrimonioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Patrimonios", key: "id" },
        onDelete: "CASCADE",
      },
      quantidadeEmprestada: { type: Sequelize.INTEGER, allowNull: false },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ItensEmprestimoPatrimonio");
  },
};
