"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Altera a coluna 'classificacao' da tabela 'Biblioteca' para o tipo ENUM.
     * Isto garante que apenas os valores de grau maçônico definidos sejam aceites.
     */
    await queryInterface.changeColumn("Biblioteca", "classificacao", {
      type: Sequelize.ENUM("Aprendiz", "Companheiro", "Mestre"),
      allowNull: true, // Mantém a coluna como opcional
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Reverte a alteração, mudando a coluna 'classificacao' de volta para STRING.
     * Isto é necessário caso precise de reverter a migração.
     */
    await queryInterface.changeColumn("Biblioteca", "classificacao", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
