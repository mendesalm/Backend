'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('MasonicSessions', {
      fields: ['dataSessao'],
      type: 'unique',
      name: 'unique_dataSessao'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('MasonicSessions', 'unique_dataSessao');
  }
};