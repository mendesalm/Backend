"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove a coluna 'sessionId' antiga e desnecessária da tabela Balaustres
    await queryInterface.removeColumn("Balaustres", "sessionId");
  },

  async down(queryInterface, Sequelize) {
    // Processo reverso: adiciona a coluna de volta se precisar desfazer
    await queryInterface.addColumn("Balaustres", "sessionId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Permite nulo para evitar quebrar dados existentes
    });
  },
};
