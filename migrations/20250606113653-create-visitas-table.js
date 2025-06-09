'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Visitas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dataSessao: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tipoSessao: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lojaVisitada: {
        type: Sequelize.STRING,
        allowNull: false
      },
      orienteLojaVisitada: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'LodgeMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Visitas');
  }
};