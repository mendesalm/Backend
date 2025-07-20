'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Novos valores para tipoSessao
    await queryInterface.changeColumn('MasonicSessions', 'tipoSessao', {
      type: Sequelize.ENUM("Ordinária", "Magna", "Publica", "Especial"),
      allowNull: false,
    });

    // Novos valores para subtipoSessao
    await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
      type: Sequelize.ENUM("Aprendiz", "Companheiro", "Mestre", "Instalação e Posse", "Comemorativa", "Iniciação", "Elevação", "Exaltação"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte para os valores antigos de tipoSessao
    await queryInterface.changeColumn('MasonicSessions', 'tipoSessao', {
      type: Sequelize.ENUM("Ordinária", "Magna", "Especial", "Econômica"),
      allowNull: false,
    });

    // Reverte para os valores antigos de subtipoSessao
    await queryInterface.changeColumn('MasonicSessions', 'subtipoSessao', {
      type: Sequelize.ENUM("Aprendiz", "Companheiro", "Mestre", "Exaltação", "Iniciação", "Elevação", "Pública"),
      allowNull: false,
    });
  },
};