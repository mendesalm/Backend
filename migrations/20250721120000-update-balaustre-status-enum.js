'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Altera a coluna para um tipo temporário (VARCHAR)
    await queryInterface.changeColumn('Balaustres', 'status', {
      type: Sequelize.STRING(20), // Tamanho suficiente para os novos valores
      allowNull: false,
      defaultValue: 'Minuta',
    });

    // 2. Atualiza os valores existentes para corresponder aos novos enums
    await queryInterface.sequelize.query(`
      UPDATE Balaustres SET status = 'Minuta' WHERE status = 'Rascunho'
    `);
    await queryInterface.sequelize.query(`
      UPDATE Balaustres SET status = 'Aprovado' WHERE status = 'Assinado'
    `);

    // 3. Altera a definição da coluna para o novo ENUM
    await queryInterface.changeColumn('Balaustres', 'status', {
      type: Sequelize.ENUM('Minuta', 'Aprovado'),
      allowNull: false,
      defaultValue: 'Minuta',
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Altera a coluna para um tipo temporário (VARCHAR)
    await queryInterface.changeColumn('Balaustres', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'Rascunho',
    });

    // 2. Reverte os valores para os enums antigos
    await queryInterface.sequelize.query(`
      UPDATE Balaustres SET status = 'Rascunho' WHERE status = 'Minuta'
    `);
    await queryInterface.sequelize.query(`
      UPDATE Balaustres SET status = 'Assinado' WHERE status = 'Aprovado'
    `);

    // 3. Reverte a definição da coluna para o ENUM antigo
    await queryInterface.changeColumn('Balaustres', 'status', {
      type: Sequelize.ENUM('Rascunho', 'Assinado'),
      allowNull: false,
      defaultValue: 'Rascunho',
    });
  },
};