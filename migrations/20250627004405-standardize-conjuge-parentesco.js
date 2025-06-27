'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Atualizar todos os registros existentes de 'Esposa' para 'Cônjuge' com sintaxe MySQL
    await queryInterface.sequelize.query(
      "UPDATE `FamilyMembers` SET `parentesco` = 'Cônjuge' WHERE `parentesco` = 'Esposa'"
    );

    // 2. Alterar a definição da coluna ENUM para remover 'Esposa'
    await queryInterface.changeColumn('FamilyMembers', 'parentesco', {
      type: Sequelize.ENUM('Cônjuge', 'Filho', 'Filha'),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Para reverter, primeiro readicionamos 'Esposa' ao ENUM.
    await queryInterface.changeColumn('FamilyMembers', 'parentesco', {
      type: Sequelize.ENUM('Cônjuge', 'Esposa', 'Filho', 'Filha'),
      allowNull: false,
    });
  },
};