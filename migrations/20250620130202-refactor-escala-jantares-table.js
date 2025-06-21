"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Renomeia a tabela para refletir seu novo propósito
      await queryInterface.renameTable(
        "EscalaJantares",
        "ResponsabilidadesJantar",
        { transaction }
      );

      // Adiciona a nova coluna para permitir a designação manual para uma sessão futura
      await queryInterface.addColumn(
        "ResponsabilidadesJantar",
        "sessaoDesignadaId",
        {
          type: Sequelize.INTEGER,
          allowNull: true, // É nulo para membros na escala sequencial
          references: {
            model: "MasonicSessions",
            key: "id",
          },
          onDelete: "SET NULL", // Se a sessão for deletada, a designação é removida mas o membro continua na escala
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        "ResponsabilidadesJantar",
        "sessaoDesignadaId",
        { transaction }
      );
      await queryInterface.renameTable(
        "ResponsabilidadesJantar",
        "EscalaJantares",
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
