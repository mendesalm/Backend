'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MembroComissoes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      comissaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Comissoes', key: 'id' },
        onDelete: 'CASCADE'
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onDelete: 'CASCADE'
      }
    });
    // Adicionar um índice único para garantir que um membro não possa ser adicionado duas vezes à mesma comissão
    await queryInterface.addConstraint('MembroComissoes', {
      fields: ['comissaoId', 'lodgeMemberId'],
      type: 'unique',
      name: 'unique_member_in_comissao'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MembroComissoes');
  }
};