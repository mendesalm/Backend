"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // CORREÇÃO: Removida a opção 'after'
      await queryInterface.addColumn(
        "MasonicSessions",
        "editalGoogleDocId",
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      // CORREÇÃO: Removida a opção 'after'
      await queryInterface.addColumn(
        "MasonicSessions",
        "caminhoEditalPdf",
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        "MasonicSessions",
        "editalGoogleDocId",
        { transaction }
      );
      await queryInterface.removeColumn("MasonicSessions", "caminhoEditalPdf", {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
