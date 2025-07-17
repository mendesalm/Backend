ainda'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const mensagens = [];

    // Mensagens para Irmãos
    for (let i = 1; i <= 10; i++) {
      mensagens.push({
        tipo: 'ANIVERSARIO',
        subtipo: 'IRMAO',
        conteudo: `Mensagem de aniversário para irmão, variação #${i}. Que a luz do Grande Arquiteto do Universo ilumine sempre seus passos.`,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Mensagens para Familiares
    for (let i = 1; i <= 10; i++) {
      mensagens.push({
        tipo: 'ANIVERSARIO',
        subtipo: 'FAMILIAR',
        conteudo: `Mensagem de aniversário para familiar, variação #${i}. Desejamos a você um dia repleto de alegrias e felicidades.`,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('CorposMensagens', mensagens, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CorposMensagens', null, {});
  }
};