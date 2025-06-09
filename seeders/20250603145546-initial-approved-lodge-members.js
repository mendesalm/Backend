// seeders/20250603145546-initial-approved-lodge-members.js
'use strict';
const bcrypt = require('bcryptjs');

// --- CORREÇÃO ADICIONADA ---
// Carrega as variáveis de ambiente do ficheiro .env
// Garante que as senhas iniciais estejam disponíveis em process.env
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    // Garante que as senhas foram carregadas do .env antes de continuar
    if (!process.env.ADMIN_INITIAL_PASSWORD || !process.env.WEBMASTER_INITIAL_PASSWORD) {
      throw new Error('As senhas iniciais (ADMIN_INITIAL_PASSWORD, WEBMASTER_INITIAL_PASSWORD, etc.) não foram encontradas no ficheiro .env');
    }
    
    // Gera o hash das senhas antes da inserção
    const hashedPasswordAdmin = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 10);
    const hashedPasswordWebmaster = await bcrypt.hash(process.env.WEBMASTER_INITIAL_PASSWORD, 10);
    const hashedPasswordDiretoria = await bcrypt.hash(process.env.DIRETORIA_INITIAL_PASSWORD, 10);
    const hashedPasswordMembro = await bcrypt.hash(process.env.MEMBRO_INITIAL_PASSWORD, 10);

    const cpfsParaDeletar = [
      '000.000.000-01',
      '000.000.000-02',
      '000.000.000-03',
      '000.000.000-04'
    ];
    // Limpa os utilizadores existentes para evitar erros de duplicidade ao executar o seeder novamente
    await queryInterface.bulkDelete('LodgeMembers', {
      CPF: { [Sequelize.Op.in]: cpfsParaDeletar }
    }, {});


    await queryInterface.bulkInsert('LodgeMembers', [
      {
        NomeCompleto: 'Andre Luiz Mendes',
        CIM: '272875',
        CPF: '831.059.806-87',
        Email: 'mendesalm@gmail.com',
        DataNascimento: new Date('1974-07-23'),
        SenhaHash: hashedPasswordAdmin,
        credencialAcesso: 'Webmaster',
        statusCadastro: 'Aprovado',
        Situacao: 'Ativo',
        Graduacao: 'Mestre',
        createdAt: now,
        updatedAt: now
      },
      {
        NomeCompleto: 'Webmaster SysJPJ',
        CIM: '000001',
        CPF: '000.000.000-02',
        Email: 'webmaster@sysjpj.com',
        DataNascimento: new Date('1990-01-01'),
        SenhaHash: hashedPasswordWebmaster,
        credencialAcesso: 'Webmaster',
        statusCadastro: 'Aprovado',
        Situacao: 'Ativo',
        Graduacao: 'Mestre',
        createdAt: now,
        updatedAt: now
      },
      {
        NomeCompleto: 'Membro Diretoria',
        CIM: '000002',
        CPF: '000.000.000-03',
        Email: 'diretoria@sysjpj.com',
        DataNascimento: new Date('1990-01-01'),
        SenhaHash: hashedPasswordDiretoria,
        credencialAcesso: 'Diretoria',
        statusCadastro: 'Aprovado',
        Situacao: 'Ativo',
        Graduacao: 'Mestre',
        createdAt: now,
        updatedAt: now
      },
      {
        NomeCompleto: 'Membro Comum',
        CIM: '000003',
        CPF: '000.000.000-04',
        Email: 'membro@sysjpj.com',
        DataNascimento: new Date('1990-01-01'),
        SenhaHash: hashedPasswordMembro,
        credencialAcesso: 'Membro',
        statusCadastro: 'Aprovado',
        Situacao: 'Ativo',
        Graduacao: 'Mestre',
        createdAt: now,
        updatedAt: now
      }
    ], {});

    console.log('Seed (CommonJS): Maçons iniciais aprovados inseridos com sucesso.');
  },

  async down (queryInterface, Sequelize) {
    // Aprimorado para deletar apenas os utilizadores criados por este seeder
    const cpfsParaDeletar = [
      '000.000.000-01',
      '000.000.000-02',
      '000.000.000-03',
      '000.000.000-04'
    ];
    await queryInterface.bulkDelete('LodgeMembers', {
      CPF: { [Sequelize.Op.in]: cpfsParaDeletar }
    }, {});
  }
};