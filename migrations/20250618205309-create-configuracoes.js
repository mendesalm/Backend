"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Configuracoes", {
      chave: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      valor: { type: Sequelize.STRING, allowNull: false },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Configuracoes");
  },
};
