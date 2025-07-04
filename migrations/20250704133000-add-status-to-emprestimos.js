"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Emprestimos", "status", {
      type: Sequelize.ENUM("solicitado", "aprovado", "rejeitado", "devolvido"),
      allowNull: false,
      defaultValue: "aprovado", // 'aprovado' para manter compatibilidade com empréstimos existentes
    });

    // Atualiza os empréstimos existentes para um status apropriado.
    // Empréstimos com data de devolução são 'devolvido'.
    await queryInterface.sequelize.query(
      `UPDATE Emprestimos SET status = 'devolvido' WHERE dataDevolucaoReal IS NOT NULL`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Emprestimos", "status");
  },
};
