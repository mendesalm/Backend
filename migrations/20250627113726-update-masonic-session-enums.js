'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('MasonicSessions', 'tipoSessao', {
      type: Sequelize.ENUM("Ordinária", "Magna", "Especial", "Econômica"),
      allowNull: false,
    });
    await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
      type: Sequelize.ENUM("Aprendiz", "Companheiro", "Mestre", "Exaltação", "Iniciação", "Elevação", "Pública"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('MasonicSessions', 'tipoSessao', {
      type: Sequelize.ENUM("Ordinária", "Magna"),
      allowNull: false,
    });
    await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
      type: Sequelize.ENUM("Aprendiz", "Companheiro", "Mestre", "Pública"),
      allowNull: false,
    });
  },
};