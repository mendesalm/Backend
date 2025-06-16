"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("MensagemTemplates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      eventoGatilho: {
        type: Sequelize.ENUM(
          "ANIVERSARIO_MEMBRO",
          "ANIVERSARIO_FAMILIAR",
          "ANIVERSARIO_MACONICO",
          "CADASTRO_APROVADO",
          "AVISO_AUSENCIA_CONSECUTIVA",
          "CONVOCACAO_SESSAO_COLETIVA"
        ),
        allowNull: false,
        unique: true,
      },
      canal: {
        type: Sequelize.ENUM("EMAIL"),
        allowNull: false,
        defaultValue: "EMAIL",
      },
      assunto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      corpo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("MensagemTemplates");
  },
};
