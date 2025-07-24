'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ResponsabilidadesJantar', 'ordem');
    await queryInterface.addColumn('ResponsabilidadesJantar', 'foiResponsavelNoCiclo', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ResponsabilidadesJantar', 'foiResponsavelNoCiclo');
    await queryInterface.addColumn('ResponsabilidadesJantar', 'ordem', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
};