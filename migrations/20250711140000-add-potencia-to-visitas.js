"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Visitas", "potenciaLojaVisitada", {
      type: Sequelize.STRING,
      allowNull: true, // O campo é opcional
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Visitas", "potenciaLojaVisitada");
  },
};
