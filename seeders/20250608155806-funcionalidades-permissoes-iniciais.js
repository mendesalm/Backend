'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const funcionalidades = [
      // Módulo Geral / Dashboard
      { 
        nomeFuncionalidade: 'acessarDashboard', 
        descricao: 'Permite o acesso geral ao dashboard/área restrita.', 
        credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), 
        cargosPermitidos: JSON.stringify([]), 
        createdAt: now, updatedAt: now 
      },
      { 
        nomeFuncionalidade: 'visualizarCalendario', 
        descricao: 'Permite visualizar o calendário de eventos e sessões.', 
        credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), 
        cargosPermitidos: JSON.stringify([]), 
        createdAt: now, updatedAt: now 
      },
      { 
        nomeFuncionalidade: 'visualizarMuralDeAvisos', 
        descricao: 'Permite visualizar o mural de avisos da loja.', 
        credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), 
        cargosPermitidos: JSON.stringify([]), 
        createdAt: now, updatedAt: now 
      },
      { 
        nomeFuncionalidade: 'gerenciarMuralDeAvisos', 
        descricao: 'Permite adicionar, editar e remover avisos do mural.', 
        credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), 
        cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), 
        createdAt: now, updatedAt: now 
      },

      // Módulo de Membros (LodgeMembers)
      { nomeFuncionalidade: 'visualizarProprioPerfil', descricao: 'Permite ao utilizador visualizar os seus próprios dados cadastrais.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarProprioPerfil', descricao: 'Permite ao utilizador editar os seus próprios dados cadastrais.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarTodosOsMembros', descricao: 'Permite visualizar a lista completa de todos os membros da loja.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Venerável Mestre', 'Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'visualizarDetalhesDeMembroPorAdmin', descricao: 'Permite visualizar os detalhes completos de um membro específico.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Venerável Mestre', 'Secretário']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'criarNovoMembroPeloAdmin', descricao: 'Permite criar um novo registo de membro diretamente no sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'editarMembroPorAdmin', descricao: 'Permite editar os dados de qualquer membro no sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'deletarMembroPorAdmin', descricao: 'Permite deletar o registo de um membro do sistema.', credenciaisPermitidas: JSON.stringify(['Webmaster']), cargosPermitidos: JSON.stringify(['Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'gerenciarStatusCadastroMembro', descricao: 'Permite aprovar ou rejeitar o status de cadastro de um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      
      // Módulo de Familiares
      { nomeFuncionalidade: 'gerenciarPropriosFamiliares', descricao: 'Permite ao membro criar, visualizar, editar e deletar seus familiares.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },

      // Módulo de Cargos
      { nomeFuncionalidade: 'gerenciarCargosDeMembro', descricao: 'Permite adicionar, editar e remover cargos de um membro.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      
      // Módulo de Sessões
      { nomeFuncionalidade: 'gerenciarSessoes', descricao: 'Permite criar, editar e deletar sessões maçônicas.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarSessoes', descricao: 'Permite listar e visualizar todas as sessões.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      
      // Módulo de Publicações
      { nomeFuncionalidade: 'gerenciarPublicacoes', descricao: 'Permite criar, editar e deletar publicações.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Secretário', 'Orador', 'Orador Adjunto']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarTodasPublicacoes', descricao: 'Permite listar e visualizar todas as publicações.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      
      // Módulo de Harmonia
      { nomeFuncionalidade: 'gerenciarHarmonia', descricao: 'Permite gerenciar os registros de áudio da harmonia.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Mestre de Harmonia', 'Mestre de Harmonia Adjunto']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarItensHarmonia', descricao: 'Permite listar e ouvir os áudios da harmonia.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },

      // Módulo de Biblioteca
      { nomeFuncionalidade: 'gerenciarBiblioteca', descricao: 'Permite gerenciar os livros da biblioteca.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Bibliotecário', 'Bibliotecário Adjunto']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'listarLivrosBiblioteca', descricao: 'Permite listar e visualizar os livros da biblioteca.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria', 'Membro']), cargosPermitidos: JSON.stringify([]), createdAt: now, updatedAt: now },
      
      // Módulo Financeiro (Exemplo)
      { nomeFuncionalidade: 'visualizarFinanceiro', descricao: 'Permite visualizar o balanço financeiro da loja.', credenciaisPermitidas: JSON.stringify(['Webmaster', 'Diretoria']), cargosPermitidos: JSON.stringify(['Tesoureiro', 'Tesoureiro Adjunto', 'Venerável Mestre']), createdAt: now, updatedAt: now },
      { nomeFuncionalidade: 'gerenciarTransacoes', descricao: 'Permite registrar entradas e saídas financeiras.', credenciaisPermitidas: JSON.stringify(['Webmaster']), cargosPermitidos: JSON.stringify(['Tesoureiro', 'Tesoureiro Adjunto']), createdAt: now, updatedAt: now },
    ];

    // Limpa a tabela antes de inserir para evitar duplicados e remover permissões antigas
    await queryInterface.bulkDelete('FuncionalidadePermissoes', null, {});
    await queryInterface.bulkInsert('FuncionalidadePermissoes', funcionalidades, {});
    console.log('Seeder de FuncionalidadePermissoes executado com sucesso.');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FuncionalidadePermissoes', null, {});
    console.log('Seeder de FuncionalidadePermissoes revertido.');
  }
};
