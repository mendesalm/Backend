'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('DocumentosGerados', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.ENUM('Prancha', 'Convite', 'Cartão'),
        allowNull: false,
      },
      numero: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ano: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      conteudo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'LodgeMembers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    }).then(() => {
      return queryInterface.addIndex('DocumentosGerados', ['numero', 'ano'], {
        unique: true,
        where: {
          tipo: 'Prancha',
        },
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DocumentosGerados');
  },
};