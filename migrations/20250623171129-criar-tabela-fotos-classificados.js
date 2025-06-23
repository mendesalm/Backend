"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FotosClassificados", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      caminhoArquivo: { type: Sequelize.STRING, allowNull: false },
      classificadoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Classificados", key: "id" },
        onDelete: "CASCADE",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("FotosClassificados");
  },
};
