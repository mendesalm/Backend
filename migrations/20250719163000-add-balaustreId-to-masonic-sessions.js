'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('MasonicSessions', 'balaustreId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Balaustres',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('MasonicSessions', 'balaustreId');
  }
};