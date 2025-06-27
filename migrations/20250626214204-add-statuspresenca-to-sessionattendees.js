// migrations/YYYYMMDDHHMMSS-add-statuspresenca-to-sessionattendees.js
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "SessionAttendees", // Nome exato da tabela
      "statusPresenca", // Nome da nova coluna
      {
        type: Sequelize.ENUM("Presente", "Justificado", "Ausente"),
        allowNull: false,
        defaultValue: "Ausente",
        after: "lodgeMemberId", // Opcional: posiciona a coluna no banco de dados
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SessionAttendees", "statusPresenca");
  },
};
