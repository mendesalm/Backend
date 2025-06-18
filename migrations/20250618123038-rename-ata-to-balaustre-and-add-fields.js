"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable("Atas", "Balaustres");

    await queryInterface.addColumn("Balaustres", "googleDocId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Balaustres", "caminhoPdfLocal", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    // --- CORREÇÃO AQUI ---
    await queryInterface.addColumn("Balaustres", "dadosFormulario", {
      type: Sequelize.JSON, // Usar JSON para MySQL
      allowNull: true,
    });
    // --- FIM DA CORREÇÃO ---
    await queryInterface.addColumn("Balaustres", "MasonicSessionId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "MasonicSessions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // ... (a lógica de 'down' permanece a mesma, mas é bom garantir)
    await queryInterface.removeColumn("Balaustres", "MasonicSessionId");
    await queryInterface.removeColumn("Balaustres", "dadosFormulario");
    await queryInterface.removeColumn("Balaustres", "caminhoPdfLocal");
    await queryInterface.removeColumn("Balaustres", "googleDocId");
    await queryInterface.renameTable("Balaustres", "Atas");
  },
};
