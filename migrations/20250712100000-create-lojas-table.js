"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Criando a tabela de Lojas...");
    await queryInterface.createTable("Lojas", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      numero: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cidade: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      estado: {
        type: Sequelize.STRING(2), // Limita a 2 caracteres para a sigla da UF
        allowNull: true,
      },
      potencia: {
        type: Sequelize.STRING,
        allowNull: true,
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

    // Adiciona um índice único para evitar lojas duplicadas com o mesmo nome, número e oriente.
    await queryInterface.addIndex(
      "Lojas",
      ["nome", "numero", "cidade", "estado"],
      {
        unique: true,
        name: "unique_loja_idx",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Lojas");
  },
};
