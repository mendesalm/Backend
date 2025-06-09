'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('INICIANDO MIGRAÇÃO CONSOLIDADA: Configuração completa do esquema...');

    // 1. Tabela LodgeMembers
    await queryInterface.createTable('LodgeMembers', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      NomeCompleto: { type: Sequelize.STRING, allowNull: false },
      CIM: { type: Sequelize.STRING, unique: true, allowNull: true },
      CPF: { type: Sequelize.STRING, unique: true, allowNull: false },
      Identidade: { type: Sequelize.STRING, allowNull: true },
      Email: { type: Sequelize.STRING, allowNull: false, unique: true },
      FotoPessoal_Caminho: { type: Sequelize.STRING, allowNull: true },
      DataNascimento: { type: Sequelize.DATEONLY, allowNull: true },
      DataCasamento: { type: Sequelize.DATEONLY, allowNull: true },
      Endereco_Rua: { type: Sequelize.STRING, allowNull: true },
      Endereco_Numero: { type: Sequelize.STRING, allowNull: true },
      Endereco_Bairro: { type: Sequelize.STRING, allowNull: true },
      Endereco_Cidade: { type: Sequelize.STRING, allowNull: true },
      Endereco_CEP: { type: Sequelize.STRING, allowNull: true },
      Telefone: { type: Sequelize.STRING, allowNull: true },
      Naturalidade: { type: Sequelize.STRING, allowNull: true },
      Nacionalidade: { type: Sequelize.STRING, allowNull: true },
      Religiao: { type: Sequelize.STRING, allowNull: true },
      NomePai: { type: Sequelize.STRING, allowNull: true },
      NomeMae: { type: Sequelize.STRING, allowNull: true },
      FormacaoAcademica: { type: Sequelize.STRING, allowNull: true },
      Ocupacao: { type: Sequelize.STRING, allowNull: true },
      LocalTrabalho: { type: Sequelize.STRING, allowNull: true },
      Situacao: { type: Sequelize.STRING, allowNull: true },
      Graduacao: { type: Sequelize.ENUM('Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'), allowNull: true },
      DataIniciacao: { type: Sequelize.DATEONLY, allowNull: true },
      DataElevacao: { type: Sequelize.DATEONLY, allowNull: true },
      DataExaltacao: { type: Sequelize.DATEONLY, allowNull: true },
      DataFiliacao: { type: Sequelize.DATEONLY, allowNull: true },
      DataRegularizacao: { type: Sequelize.DATEONLY, allowNull: true },
      SenhaHash: { type: Sequelize.STRING, allowNull: false },
      Funcao: { type: Sequelize.STRING, defaultValue: 'user', allowNull: true },
      credencialAcesso: { type: Sequelize.ENUM('Webmaster', 'Diretoria', 'Membro'), allowNull: false, defaultValue: 'Membro' },
      grauFilosofico: { type: Sequelize.STRING, allowNull: true },
      statusCadastro: { type: Sequelize.ENUM('Pendente', 'Aprovado', 'Rejeitado', 'VerificacaoEmailPendente'), allowNull: false, defaultValue: 'Pendente' },
      emailVerificationToken: { type: Sequelize.STRING, allowNull: true },
      emailVerificationExpires: { type: Sequelize.DATE, allowNull: true },
      UltimoLogin: { type: Sequelize.DATE, allowNull: true },
      resetPasswordToken: { type: Sequelize.STRING, allowNull: true },
      resetPasswordExpires: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela LodgeMembers criada.');

    // 2. Tabela FamilyMembers
    await queryInterface.createTable('FamilyMembers', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nomeCompleto: { type: Sequelize.STRING, allowNull: false },
      parentesco: { type: Sequelize.ENUM('cônjuge', 'filho', 'filha'), allowNull: false },
      dataNascimento: { type: Sequelize.DATEONLY, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true, unique: true },
      telefone: { type: Sequelize.STRING, allowNull: true },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela FamilyMembers criada.');

    // 3. Tabela CargosExercidos
    await queryInterface.createTable('CargosExercidos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nomeCargo: { type: Sequelize.ENUM("Venerável Mestre", "Primeiro Vigilante", "Segundo Vigilante", "Orador", "Orador Adjunto", "Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Tesoureiro", "Tesoureiro Adjunto", "Mestre de Cerimônias", "Mestre de Harmonia", "Mestre de Harmonia Adjunto", "Arquiteto", "Arquiteto Adjunto", "Bibliotecário", "Bibliotecário Adjunto", "Primeiro Diácono", "Segundo Diácono", "Primeiro Experto", "Segundo Experto", "Cobridor Interno", "Cobridor Externo", "Hospitaleiro", "Porta Bandeira", "Porta Estandarte", "Deputado Estadual", "Deputado Federal", "Sem cargo definido"), allowNull: false },
      dataInicio: { type: Sequelize.DATEONLY, allowNull: false },
      dataTermino: { type: Sequelize.DATEONLY, allowNull: true },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela CargosExercidos criada.');

    // 4. Tabela MasonicSessions
    await queryInterface.createTable('MasonicSessions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      dataSessao: { type: Sequelize.DATEONLY, allowNull: false },
      tipoSessao: { type: Sequelize.ENUM('Ordinária', 'Magna'), allowNull: false },
      subtipoSessao: { type: Sequelize.ENUM('Aprendiz', 'Companheiro', 'Mestre', 'Pública'), allowNull: false },
      troncoDeBeneficencia: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      responsavelJantarLodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      conjugeResponsavelJantarNome: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela MasonicSessions criada.');

    // 5. Tabela SessionAttendees (Tabela de Junção)
    await queryInterface.createTable('SessionAttendees', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      sessionId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'MasonicSessions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('SessionAttendees', ['sessionId', 'lodgeMemberId'], {
      unique: true, name: 'session_member_unique_idx'
    });
    console.log('Tabela SessionAttendees criada.');

    // 6. Tabela VisitantesSessao
    await queryInterface.createTable('VisitantesSessao', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nomeCompleto: { type: Sequelize.STRING, allowNull: false },
      graduacao: { type: Sequelize.STRING, allowNull: true },
      cim: { type: Sequelize.STRING, allowNull: true },
      potencia: { type: Sequelize.STRING, allowNull: true },
      loja: { type: Sequelize.STRING, allowNull: true },
      oriente: { type: Sequelize.STRING, allowNull: true },
      masonicSessionId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'MasonicSessions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela VisitantesSessao criada.');

    // 7. Tabela Atas
    await queryInterface.createTable('Atas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      numero: { type: Sequelize.STRING, allowNull: false },
      ano: { type: Sequelize.INTEGER, allowNull: false },
      dataDeAprovacao: { type: Sequelize.DATEONLY, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: false },
      sessionId: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'MasonicSessions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Atas criada.');

    // 8. Tabela Publicacoes
    await queryInterface.createTable('Publicacoes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      data: { type: Sequelize.DATEONLY, allowNull: false },
      tema: { type: Sequelize.STRING, allowNull: false },
      nome: { type: Sequelize.STRING, allowNull: false },
      grau: { type: Sequelize.STRING, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: false },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Publicacoes criada.');

    // 9. Tabela Harmonia
    await queryInterface.createTable('Harmonia', { // Nome da tabela como no modelo
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      categoria: { type: Sequelize.STRING, allowNull: true },
      subcategoria: { type: Sequelize.STRING, allowNull: true },
      titulo: { type: Sequelize.STRING, allowNull: false },
      autor: { type: Sequelize.STRING, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: true },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Harmonia criada.');

    // 10. Tabela Biblioteca
    await queryInterface.createTable('Biblioteca', { // Nome da tabela como no modelo
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      titulo: { type: Sequelize.STRING, allowNull: false },
      autores: { type: Sequelize.STRING, allowNull: true },
      editora: { type: Sequelize.STRING, allowNull: true },
      anoPublicacao: { type: Sequelize.INTEGER, allowNull: true },
      ISBN: { type: Sequelize.STRING, allowNull: true, unique: true },
      numeroPaginas: { type: Sequelize.INTEGER, allowNull: true },
      classificacao: { type: Sequelize.STRING, allowNull: true },
      observacoes: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('Disponível', 'Emprestado', 'Manutenção', 'Perdido'), defaultValue: 'Disponível', allowNull: false },
      path: { type: Sequelize.STRING, allowNull: true },
      lodgeMemberId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela Biblioteca criada.');

    // 11. Tabela FuncionalidadePermissoes
    await queryInterface.createTable('FuncionalidadePermissoes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nomeFuncionalidade: { type: Sequelize.STRING, allowNull: false, unique: true },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      credenciaisPermitidas: { type: Sequelize.JSON, allowNull: false, defaultValue: '[]' },
      cargosPermitidos: { type: Sequelize.JSON, allowNull: true, defaultValue: '[]' },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    console.log('Tabela FuncionalidadePermissoes criada.');

    console.log('MIGRAÇÃO CONSOLIDADA: Esquema completo criado com sucesso.');
  },

  async down(queryInterface, Sequelize) {
    console.log('REVERTENDO MIGRAÇÃO CONSOLIDADA: Removendo esquema completo...');
    // A ordem de drop deve ser o inverso da criação para respeitar as chaves estrangeiras
    await queryInterface.dropTable('FuncionalidadePermissoes');
    console.log('Tabela FuncionalidadePermissoes removida.');
    await queryInterface.dropTable('Biblioteca');
    console.log('Tabela Biblioteca removida.');
    await queryInterface.dropTable('Harmonia');
    console.log('Tabela Harmonia removida.');
    await queryInterface.dropTable('Publicacoes');
    console.log('Tabela Publicacoes removida.');
    await queryInterface.dropTable('Atas');
    console.log('Tabela Atas removida.');
    await queryInterface.dropTable('VisitantesSessao');
    console.log('Tabela VisitantesSessao removida.');
    await queryInterface.dropTable('SessionAttendees');
    console.log('Tabela SessionAttendees removida.');
    await queryInterface.dropTable('MasonicSessions');
    console.log('Tabela MasonicSessions removida.');
    await queryInterface.dropTable('CargosExercidos');
    console.log('Tabela CargosExercidos removida.');
    await queryInterface.dropTable('FamilyMembers');
    console.log('Tabela FamilyMembers removida.');
    await queryInterface.dropTable('LodgeMembers');
    console.log('Tabela LodgeMembers removida.');
    console.log('REVERSÃO DA MIGRAÇÃO CONSOLIDADA concluída.');
  }
};