"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Adicionando a chave estrangeira lojaId a Visitas e VisitantesSessao..."
      );

      // Adiciona a coluna lojaId à tabela Visitas
      await queryInterface.addColumn(
        "Visitas",
        "lojaId",
        {
          type: Sequelize.INTEGER,
          allowNull: true, // Permitir nulo temporariamente para a migração de dados
          references: {
            model: "Lojas", // Nome da tabela de referência
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL", // Se uma loja for apagada, o registo de visita permanece sem associação
        },
        { transaction }
      );

      // Adiciona a coluna lojaId à tabela VisitantesSessao
      await queryInterface.addColumn(
        "VisitantesSessao",
        "lojaId",
        {
          type: Sequelize.INTEGER,
          allowNull: true, // Permitir nulo temporariamente para a migração de dados
          references: {
            model: "Lojas", // Nome da tabela de referência
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );

      await transaction.commit();
      console.log("Colunas lojaId adicionadas com sucesso.");
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao adicionar colunas lojaId:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("Visitas", "lojaId", { transaction });
      await queryInterface.removeColumn("VisitantesSessao", "lojaId", {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao reverter a adição das colunas lojaId:", error);
      throw error;
    }
  },
};
