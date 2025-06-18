"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EscalaJantares", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      membroId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "LodgeMembers", key: "id" },
        onDelete: "CASCADE",
      },
      ordem: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM("ativo", "pulado"),
        allowNull: false,
        defaultValue: "ativo",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("EscalaJantares");
  },
};
