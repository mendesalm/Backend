// migrations/xxxxxxxx-criar-tabela-patrimonios.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Patrimonios', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nome: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      dataAquisicao: { type: Sequelize.DATEONLY, allowNull: false },
      valorAquisicao: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      estadoConservacao: { type: Sequelize.ENUM('Novo', 'Bom', 'Regular', 'Necessita Reparo', 'Inservível'), allowNull: false, defaultValue: 'Bom' },
      localizacao: { type: Sequelize.STRING, allowNull: true },
      registradoPorId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Permitir nulo para manter o registo se o autor for deletado
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Patrimonios criada.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Patrimonios');
    console.log('Tabela Patrimonios removida.');
  }
};
