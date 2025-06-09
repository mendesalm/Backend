'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MenuItems', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      label: { type: Sequelize.STRING, allowNull: false },
      icon: { type: Sequelize.STRING, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: false, unique: true },
      parentId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'MenuItems', key: 'id' },
        onDelete: 'CASCADE'
      },
      requiredFeature: {
        type: Sequelize.STRING, allowNull: false,
        references: { model: 'FuncionalidadePermissoes', key: 'nomeFuncionalidade' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ordem: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MenuItems');
  }
};
