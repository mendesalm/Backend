// seeders/xxxxxxxx-menu-items-iniciais.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('MenuItems', [
      // Nível Superior
      { id: 10, label: 'Dashboard', icon: 'home', path: '/', requiredFeature: 'acessarDashboard', parentId: null, ordem: 10, createdAt: now, updatedAt: now },
      { id: 20, label: 'Membros', icon: 'users', path: '/membros', requiredFeature: 'listarTodosOsMembros', parentId: null, ordem: 20, createdAt: now, updatedAt: now },
      { id: 30, label: 'Calendário', icon: 'calendar', path: '/eventos', requiredFeature: 'visualizarCalendario', parentId: null, ordem: 30, createdAt: now, updatedAt: now },
      { id: 40, label: 'Biblioteca', icon: 'book-open', path: '/biblioteca', requiredFeature: 'listarLivrosBiblioteca', parentId: null, ordem: 40, createdAt: now, updatedAt: now },
      { id: 50, label: 'Financeiro', icon: 'dollar-sign', path: '/financeiro', requiredFeature: 'visualizarRelatorioFinanceiro', parentId: null, ordem: 50, createdAt: now, updatedAt: now },
      { id: 60, label: 'Relatórios', icon: 'file-text', path: '/relatorios', requiredFeature: 'exportarRelatorioMembros', parentId: null, ordem: 60, createdAt: now, updatedAt: now },
      { id: 70, label: 'Administração', icon: 'sliders', path: '/admin', requiredFeature: 'editarConfiguracoesDePermissao', parentId: null, ordem: 100, createdAt: now, updatedAt: now },

      // Submenus de Relatórios (parentId: 60)
      { id: 601, label: 'Quadro de Obreiros', icon: 'users', path: '/relatorios/membros', requiredFeature: 'exportarRelatorioMembros', parentId: 60, ordem: 10, createdAt: now, updatedAt: now },
      { id: 602, label: 'Frequência', icon: 'check-square', path: '/relatorios/frequencia', requiredFeature: 'exportarRelatorioFrequencia', parentId: 60, ordem: 20, createdAt: now, updatedAt: now },
      { id: 603, label: 'Aniversariantes', icon: 'gift', path: '/relatorios/aniversariantes', requiredFeature: 'exportarRelatorioAniversariantes', parentId: 60, ordem: 30, createdAt: now, updatedAt: now },
      { id: 604, label: 'Empréstimos da Biblioteca', icon: 'book', path: '/relatorios/emprestimos', requiredFeature: 'exportarRelatorioEmprestimos', parentId: 60, ordem: 40, createdAt: now, updatedAt: now },
      { id: 605, label: 'Balancete Financeiro', icon: 'file-text', path: '/relatorios/balancete', requiredFeature: 'exportarRelatorioFinanceiro', parentId: 60, ordem: 50, createdAt: now, updatedAt: now },
      
      // Submenus de Administração (parentId: 70)
      { id: 701, label: 'Gerir Permissões', icon: 'shield', path: '/admin/permissoes', requiredFeature: 'editarConfiguracoesDePermissao', parentId: 70, ordem: 10, createdAt: now, updatedAt: now },
      { id: 702, label: 'Gerir Itens de Menu', icon: 'list', path: '/admin/menu-items', requiredFeature: 'editarConfiguracoesDePermissao', parentId: 70, ordem: 20, createdAt: now, updatedAt: now },

      // Adicione mais itens e sub-itens conforme necessário

    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('MenuItems', null, {});
  }
};