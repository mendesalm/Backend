"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("Iniciando migração e limpeza da tabela Visitas...");
      const tableDescription = await queryInterface.describeTable("Visitas");

      // Passo 1: Migrar dados, APENAS se a coluna antiga 'lojaVisitada' existir.
      if (tableDescription.lojaVisitada) {
        console.log(
          "Coluna 'lojaVisitada' encontrada. Iniciando migração de dados..."
        );
        const visitasAntigas = await queryInterface.sequelize.query(
          `SELECT DISTINCT lojaVisitada, orienteLojaVisitada, potenciaLojaVisitada FROM Visitas WHERE lojaVisitada IS NOT NULL`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        console.log(
          `Encontrados ${visitasAntigas.length} registros de lojas distintas para migrar.`
        );
        for (const visita of visitasAntigas) {
          const [loja] = await queryInterface.sequelize.query(
            `SELECT id FROM Lojas WHERE nome = :lojaVisitada`,
            {
              replacements: { lojaVisitada: visita.lojaVisitada },
              type: queryInterface.sequelize.QueryTypes.SELECT,
              transaction,
            }
          );

          let lojaId;
          if (loja) {
            lojaId = loja.id;
          } else {
            const [newLojaId] = await queryInterface.bulkInsert(
              "Lojas",
              [
                {
                  nome: visita.lojaVisitada,
                  cidade: visita.orienteLojaVisitada
                    ? visita.orienteLojaVisitada.split("-")[0]
                    : null,
                  estado: visita.orienteLojaVisitada
                    ? visita.orienteLojaVisitada.split("-")[1]
                    : null,
                  potencia: visita.potenciaLojaVisitada,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
              { transaction, returning: ["id"] }
            );
            lojaId = newLojaId.id;
          }

          await queryInterface.sequelize.query(
            `UPDATE Visitas SET lojaId = :lojaId WHERE lojaVisitada = :lojaVisitada`,
            {
              replacements: {
                lojaId: lojaId,
                lojaVisitada: visita.lojaVisitada,
              },
              transaction,
            }
          );
        }
        console.log("Migração de dados concluída.");

        // Passo 2: Remover as colunas antigas.
        console.log("Removendo colunas antigas...");
        await queryInterface.removeColumn("Visitas", "lojaVisitada", {
          transaction,
        });
        await queryInterface.removeColumn("Visitas", "orienteLojaVisitada", {
          transaction,
        });
        await queryInterface.removeColumn("Visitas", "potenciaLojaVisitada", {
          transaction,
        });
      } else {
        console.log(
          "Coluna 'lojaVisitada' não encontrada, pulando a migração de dados e remoção de colunas."
        );
      }

      // Passo 3: Garantir que a coluna lojaId seja NOT NULL e a chave estrangeira esteja correta.
      console.log("Ajustando a coluna lojaId e sua chave estrangeira...");

      try {
        // Tentamos remover a constraint antiga, se ela existir. O nome pode variar.
        // Se este passo falhar, não é crítico, o importante é a próxima alteração.
        await queryInterface.removeConstraint("Visitas", "Visitas_ibfk_2", {
          transaction,
        });
      } catch (e) {
        console.warn(
          "Aviso: Não foi possível remover a constraint antiga 'Visitas_ibfk_2'. Ela pode já ter sido removida ou ter outro nome."
        );
      }

      // Altera a coluna para ser NOT NULL e define a regra de deleção correta
      await queryInterface.changeColumn(
        "Visitas",
        "lojaId",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Lojas",
            key: "id",
          },
          onDelete: "CASCADE", // Altera para CASCADE, que é compatível com NOT NULL
          onUpdate: "CASCADE",
        },
        { transaction }
      );

      await transaction.commit();
      console.log("Refatoração da tabela Visitas concluída com sucesso!");
    } catch (error) {
      await transaction.rollback();
      console.error("Erro durante a migração da tabela Visitas:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("A reversão desta migração não é suportada automaticamente.");
  },
};
