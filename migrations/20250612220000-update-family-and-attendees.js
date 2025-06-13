"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Iniciando migração: Atualizando FamilyMembers e SessionAttendees..."
      );

      // 1. Altera a coluna 'parentesco' na tabela 'FamilyMembers'
      // Esta operação modifica o ENUM para incluir os novos valores.
      await queryInterface.changeColumn(
        "FamilyMembers",
        "parentesco",
        {
          type: Sequelize.ENUM("Cônjuge", "Esposa", "Filho", "Filha"),
          allowNull: false,
        },
        { transaction }
      );
      console.log(
        "Coluna 'parentesco' em FamilyMembers atualizada com sucesso."
      );

      // 2. Adiciona a coluna 'acompanhantes' à tabela 'SessionAttendees'
      // Esta tabela é a tabela de junção para a presença em eventos.
      await queryInterface.addColumn(
        "SessionAttendees",
        "acompanhantes",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction }
      );
      console.log(
        "Coluna 'acompanhantes' adicionada a SessionAttendees com sucesso."
      );

      await transaction.commit();
      console.log("Migração concluída com sucesso.");
    } catch (error) {
      await transaction.rollback();
      console.error("Erro durante a migração, rollback executado:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Revertendo migração: Restaurando FamilyMembers e SessionAttendees..."
      );

      // 1. Reverte a coluna 'parentesco' para a definição original
      // NOTA: Certifique-se de que não há dados no banco com os novos valores ('Esposa') antes de reverter.
      await queryInterface.changeColumn(
        "FamilyMembers",
        "parentesco",
        {
          type: Sequelize.ENUM("cônjuge", "filho", "filha"),
          allowNull: false,
        },
        { transaction }
      );
      console.log(
        "Coluna 'parentesco' em FamilyMembers revertida para o estado original."
      );

      // 2. Remove a coluna 'acompanhantes'
      await queryInterface.removeColumn("SessionAttendees", "acompanhantes", {
        transaction,
      });
      console.log("Coluna 'acompanhantes' removida de SessionAttendees.");

      await transaction.commit();
      console.log("Reversão da migração concluída com sucesso.");
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao reverter a migração, rollback executado:", error);
      throw error;
    }
  },
};
