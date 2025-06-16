"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Iniciando refatoração completa e robusta do módulo de Harmonia..."
      );

      // 1. Criar a tabela TiposSessao (com a definição completa)
      await queryInterface.createTable(
        "TiposSessao",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          nome: { type: Sequelize.STRING, allowNull: false, unique: true },
          descricao: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );
      console.log("Tabela TiposSessao criada.");

      // 2. Criar a tabela Playlists (com a definição completa)
      await queryInterface.createTable(
        "Playlists",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          nome: { type: Sequelize.STRING, allowNull: false, unique: true },
          descricao: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );
      console.log("Tabela Playlists criada.");

      // 3. Criar a tabela de junção TipoSessaoPlaylists (com a definição completa)
      await queryInterface.createTable(
        "TipoSessaoPlaylists",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          tipoSessaoId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "TiposSessao", key: "id" },
            onDelete: "CASCADE",
          },
          playlistId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "Playlists", key: "id" },
            onDelete: "CASCADE",
          },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );
      console.log("Tabela TipoSessaoPlaylists criada.");

      // 4. Descrever a tabela Harmonia para ver seu estado atual
      const harmoniaTableInfo = await queryInterface
        .describeTable("Harmonia")
        .catch(() => null);

      if (harmoniaTableInfo) {
        // Adiciona a coluna playlistId SOMENTE SE ela não existir
        if (!harmoniaTableInfo.playlistId) {
          await queryInterface.addColumn(
            "Harmonia",
            "playlistId",
            {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "Playlists", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            { transaction }
          );
          console.log('Coluna "playlistId" adicionada a Harmonia.');
        }

        // Remove a coluna categoria SOMENTE SE ela existir
        if (harmoniaTableInfo.categoria) {
          await queryInterface.removeColumn("Harmonia", "categoria", {
            transaction,
          });
          console.log('Coluna "categoria" removida.');
        }

        // Remove a coluna subcategoria SOMENTE SE ela existir
        if (harmoniaTableInfo.subcategoria) {
          await queryInterface.removeColumn("Harmonia", "subcategoria", {
            transaction,
          });
          console.log('Coluna "subcategoria" removida.');
        }

        // Renomeia a tabela para Musicas
        await queryInterface.renameTable("Harmonia", "Musicas", {
          transaction,
        });
        console.log("Tabela Harmonia renomeada para Musicas.");
      } else {
        console.log(
          "Tabela Harmonia não encontrada, pulando refatoração dela (pode já ter sido renomeada)."
        );
      }

      await transaction.commit();
      console.log("Refatoração completa aplicada com sucesso.");
    } catch (err) {
      await transaction.rollback();
      console.error("Erro durante a refatoração, rollback executado:", err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameTable("Musicas", "Harmonia", { transaction });
      await queryInterface.addColumn(
        "Harmonia",
        "subcategoria",
        { type: Sequelize.STRING },
        { transaction }
      );
      await queryInterface.addColumn(
        "Harmonia",
        "categoria",
        { type: Sequelize.STRING },
        { transaction }
      );
      await queryInterface.removeColumn("Harmonia", "playlistId", {
        transaction,
      });
      await queryInterface.dropTable("TipoSessaoPlaylists", { transaction });
      await queryInterface.dropTable("Playlists", { transaction });
      await queryInterface.dropTable("TiposSessao", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
