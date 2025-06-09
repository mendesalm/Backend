// migrations/xxxxxxxx-criar-tabela-fotos-evento.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FotosEvento', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      path: { type: Sequelize.STRING, allowNull: false },
      legenda: { type: Sequelize.STRING, allowNull: true },
      eventoId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Eventos', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      uploaderId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela FotosEvento criada.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FotosEvento');
    console.log('Tabela FotosEvento removida.');
  }
};
