"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("Iniciando correção da tabela 'ResponsabilidadesJantar'...");

      const tableInfo = await queryInterface.describeTable(
        "ResponsabilidadesJantar"
      );

      // Passo 1: Remover a coluna incorreta 'membroId', se ela existir.
      if (tableInfo.membroId) {
        console.log("Coluna 'membroId' encontrada. Removendo...");

        // O nome da constraint 'ResponsabilidadesJantar_ibfk_1' veio do seu log de erro anterior.
        // Tentamos remover a constraint antes da coluna para evitar erros.
        try {
          await queryInterface.removeConstraint(
            "ResponsabilidadesJantar",
            "ResponsabilidadesJantar_ibfk_1",
            { transaction }
          );
          console.log("Constraint 'ResponsabilidadesJantar_ibfk_1' removida.");
        } catch (e) {
          console.warn(
            "Aviso: Não foi possível remover a constraint da coluna 'membroId'. Ela pode já ter sido removida ou ter outro nome. Prosseguindo com a remoção da coluna..."
          );
        }
        await queryInterface.removeColumn(
          "ResponsabilidadesJantar",
          "membroId",
          { transaction }
        );
        console.log("Coluna 'membroId' removida com sucesso.");
      }

      // Passo 2: Garantir que a coluna correta 'lodgeMemberId' está configurada corretamente.
      if (tableInfo.lodgeMemberId) {
        console.log("Verificando a coluna correta 'lodgeMemberId'...");
        await queryInterface.changeColumn(
          "ResponsabilidadesJantar",
          "lodgeMemberId",
          {
            type: Sequelize.INTEGER,
            allowNull: false, // Garante que a coluna seja NOT NULL
            references: { model: "LodgeMembers", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          { transaction }
        );
        console.log(
          "Coluna 'lodgeMemberId' verificada e configurada corretamente."
        );
      }

      await transaction.commit();
      console.log(
        "Estrutura da tabela 'ResponsabilidadesJantar' corrigida com sucesso."
      );
    } catch (error) {
      await transaction.rollback();
      console.error(
        "Erro ao corrigir a tabela ResponsabilidadesJantar:",
        error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // A reversão desta migration não é recomendada pois o estado anterior era inconsistente.
    console.log(
      "Esta migration de correção não possui uma função 'down' para evitar a reintrodução de um estado inconsistente na tabela."
    );
  },
};
