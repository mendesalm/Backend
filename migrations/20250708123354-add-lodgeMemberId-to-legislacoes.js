"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Legislacoes", "lodgeMemberId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "LodgeMembers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Legislacoes", "lodgeMemberId");
  },
};