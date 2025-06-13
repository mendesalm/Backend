"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Este comando adiciona a nova coluna 'acompanhantes' à tabela 'ParticipanteEventos'.
    // O Sequelize geralmente pluraliza o nome do modelo. Verifique o nome exato da sua tabela se necessário.
    await queryInterface.addColumn("ParticipanteEventos", "acompanhantes", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: "lodgeMemberId", // Opcional: posiciona a nova coluna
    });
    console.log(
      "Coluna 'acompanhantes' adicionada com sucesso à tabela ParticipantesEvento."
    );
  },

  async down(queryInterface, Sequelize) {
    // Este comando reverte a migração, removendo a coluna.
    await queryInterface.removeColumn("ParticipanteEventos", "acompanhantes");
    console.log(
      "Coluna 'acompanhantes' removida com sucesso da tabela ParticipanteEventos."
    );
  },
};
