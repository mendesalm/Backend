'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // A coluna já foi criada em uma migração anterior com falha.
    // Esta migração é apenas para marcar a alteração como concluída no Sequelize.
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Comissoes', 'presidenteId');
  }
};