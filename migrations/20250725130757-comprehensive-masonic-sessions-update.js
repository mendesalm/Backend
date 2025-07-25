'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableDescription = await queryInterface.describeTable('MasonicSessions', { transaction });

      // Step 1: Handle objetivoSessao / editalGoogleDocId
      if (tableDescription.editalGoogleDocId) {
        // If editalGoogleDocId exists, rename it and change type
        await queryInterface.renameColumn('MasonicSessions', 'editalGoogleDocId', 'objetivoSessao', { transaction });
        await queryInterface.changeColumn('MasonicSessions', 'objetivoSessao', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      } else if (!tableDescription.objetivoSessao) {
        // If neither exists, add objetivoSessao
        await queryInterface.addColumn('MasonicSessions', 'objetivoSessao', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }

      // Step 2: Change subtipoSessao to STRING (if not already) to prepare for ENUM update
      // This is a safe intermediate step to avoid data truncation issues
      if (tableDescription.subtipoSessao && tableDescription.subtipoSessao.type !== 'VARCHAR(255)') {
        await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });
      }

      // Step 3: Update subtipoSessao to the new ENUM definition
      await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
        type: Sequelize.ENUM(
          'Aprendiz',
          'Companheiro',
          'Mestre',
          'Instalação e Posse',
          'Comemorativa',
          'Iniciação',
          'Elevação',
          'Exaltação',
          'Regular',
          'Magna',
          'Pública',
          'Filiação',
          'Regularização',
          'Administrativa',
          'Eleitoral'
        ),
        allowNull: true,
      }, { transaction });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableDescription = await queryInterface.describeTable('MasonicSessions', { transaction });

      // Revert subtipoSessao to old ENUM
      await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
        type: Sequelize.ENUM(
          'Aprendiz',
          'Companheiro',
          'Mestre',
          'Instalação e Posse',
          'Comemorativa',
          'Iniciação',
          'Elevação',
          'Exaltação',
          'Regular',
          'Magna',
          'Pública',
          'Filiação',
          'Regularização'
        ),
        allowNull: true,
      }, { transaction });

      // Revert objetivoSessao to editalGoogleDocId (if it was renamed) or remove it
      if (tableDescription.objetivoSessao) {
        // Check if it was originally editalGoogleDocId
        // This is a heuristic, as we don't have direct access to migration history here
        // If editalGoogleDocId was never there, we just remove objetivoSessao
        const hasEditalGoogleDocId = await queryInterface.describeTable('MasonicSessions')
          .then(desc => !!desc.editalGoogleDocId)
          .catch(() => false); // Catch error if table doesn't exist or column is gone

        if (hasEditalGoogleDocId) {
          await queryInterface.renameColumn('MasonicSessions', 'objetivoSessao', 'editalGoogleDocId', { transaction });
          await queryInterface.changeColumn('MasonicSessions', 'editalGoogleDocId', {
            type: Sequelize.STRING,
            allowNull: true,
          }, { transaction });
        } else {
          await queryInterface.removeColumn('MasonicSessions', 'objetivoSessao', { transaction });
        }
      }
    });
  }
};