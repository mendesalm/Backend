// seeders/xxxxxxxx-funcionalidades-permissoes-iniciais.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const funcionalidades = [
      // Módulo de Membros
      { nomeFuncionalidade: 'visualizarProprioPerfil', descricao: 'Permite ao utilizador visualizar os seus próprios dados cadastrais.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarProprioPerfil', descricao: 'Permite ao utilizador editar os seus próprios dados cadastrais.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarTodosOsMembros', descricao: 'Permite visualizar a lista completa de todos os membros da loja.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Venerável Mestre', 'Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'visualizarDetalhesDeMembroPorAdmin', descricao: 'Permite visualizar os detalhes completos de um membro específico.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Venerável Mestre', 'Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'criarNovoMembroPeloAdmin', descricao: 'Permite criar um novo registo de membro diretamente no sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarMembroPorAdmin', descricao: 'Permite editar os dados de qualquer membro no sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'deletarMembroPorAdmin', descricao: 'Permite deletar o registo de um membro do sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'gerenciarStatusCadastroMembro', descricao: 'Permite aprovar ou rejeitar o status de cadastro de um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário']), createdAt: now, updatedAt: now },
      
      // Módulo de Familiares
      { nomeFuncionalidade: 'listarPropriosFamiliares', descricao: 'Permite ao membro visualizar a lista dos seus familiares.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'adicionarProprioFamiliar', descricao: 'Permite ao membro adicionar um novo familiar.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarProprioFamiliar', descricao: 'Permite ao membro editar os dados de um familiar.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'deletarProprioFamiliar', descricao: 'Permite ao membro deletar o registo de um familiar.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },

      // Módulo de Cargos
      { nomeFuncionalidade: 'adicionarCargoParaMembro', descricao: 'Permite adicionar um cargo a um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarCargoDeMembro', descricao: 'Permite editar um cargo de um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'removerCargoDeMembro', descricao: 'Permite remover um cargo de um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      
      // Módulo de Sessões
      { nomeFuncionalidade: 'criarSessaoMaconica', descricao: 'Permite criar uma nova sessão maçônica.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarSessoesMaconicas', descricao: 'Permite listar todas as sessões.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'visualizarDetalhesSessaoMaconica', descricao: 'Permite ver os detalhes de uma sessão.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarSessaoMaconica', descricao: 'Permite editar uma sessão.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'deletarSessaoMaconica', descricao: 'Permite deletar uma sessão.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário']), createdAt: now, updatedAt: now },

      // Módulo de Galeria de Fotos
      { nomeFuncionalidade: 'uploadFotoEvento', descricao: 'Permite fazer o upload de fotos para a galeria de um evento.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Chanceler', 'Chanceler Adjunto', 'Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'deletarFotoEvento', descricao: 'Permite deletar uma foto da galeria de um evento.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Chanceler', 'Secretário']), createdAt: now, updatedAt: now },

      // ... (Adicione aqui as permissões para todos os outros módulos: Biblioteca, Empréstimos, Reservas, Financeiro, etc.)
    ];

    // Limpa a tabela antes de inserir para evitar duplicados
    await queryInterface.bulkDelete('FuncionalidadePermissoes', null, {});
    await queryInterface.bulkInsert('FuncionalidadePermissoes', funcionalidades, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FuncionalidadePermissoes', null, {});
  }
};
