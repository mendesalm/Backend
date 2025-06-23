"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Documentos", {
      // Nome da tabela
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT },
      caminhoArquivo: { type: Sequelize.STRING, allowNull: false },
      nomeOriginalArquivo: { type: Sequelize.STRING, allowNull: true },
      dataPublicacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        references: { model: "LodgeMembers", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Documentos");
  },
};
