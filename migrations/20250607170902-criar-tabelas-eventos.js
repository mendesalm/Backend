// migrations/xxxxxxxx-criar-tabelas-eventos.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabela Eventos
    await queryInterface.createTable('Eventos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      dataHoraInicio: { type: Sequelize.DATE, allowNull: false },
      dataHoraFim: { type: Sequelize.DATE, allowNull: true },
      local: { type: Sequelize.STRING, allowNull: false },
      tipo: { type: Sequelize.ENUM('Sessão Maçônica', 'Evento Social', 'Evento Filantrópico', 'Outro'), allowNull: false },
      criadoPorId: {
        type: Sequelize.INTEGER,
        allowNull: true, // <-- CORRIGIDO AQUI: Permitir nulo para que SET NULL funcione
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Eventos criada.');

    // Tabela de Junção ParticipantesEvento
    await queryInterface.createTable('ParticipantesEvento', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      statusConfirmacao: { type: Sequelize.ENUM('Confirmado', 'Pendente', 'Recusado'), allowNull: false, defaultValue: 'Pendente' },
      dataConfirmacao: { type: Sequelize.DATE, allowNull: true },
      eventoId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Eventos', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      }
    });
    await queryInterface.addConstraint('ParticipantesEvento', {
      fields: ['eventoId', 'lodgeMemberId'],
      type: 'unique',
      name: 'unique_participant_in_event'
    });
    console.log('Tabela ParticipantesEvento criada.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ParticipantesEvento');
    console.log('Tabela ParticipantesEvento removida.');
    await queryInterface.dropTable('Eventos');
    console.log('Tabela Eventos removida.');
  }
};