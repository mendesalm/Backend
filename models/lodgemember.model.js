import bcrypt from 'bcryptjs';

export default (sequelize, DataTypes) => {
  const LodgeMember = sequelize.define('LodgeMember', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    NomeCompleto: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Nome completo é obrigatório.' } } },
    CIM: { type: DataTypes.STRING, unique: true, allowNull: true },
    CPF: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { notEmpty: { msg: 'CPF é obrigatório.' } } },
    Identidade: { type: DataTypes.STRING, allowNull: true },
    Email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'Email é obrigatório.' }, isEmail: { msg: 'Email inválido.' } } },
    FotoPessoal_Caminho: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: { msg: 'Caminho da foto deve ser uma URL válida, se fornecido.' } } },
    DataNascimento: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de nascimento inválida.' } } },
    DataCasamento: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de casamento inválida.' } } },
    Endereco_Rua: { type: DataTypes.STRING, allowNull: true },
    Endereco_Numero: { type: DataTypes.STRING, allowNull: true },
    Endereco_Bairro: { type: DataTypes.STRING, allowNull: true },
    Endereco_Cidade: { type: DataTypes.STRING, allowNull: true },
    Endereco_CEP: { type: DataTypes.STRING, allowNull: true },
    Telefone: { type: DataTypes.STRING, allowNull: true },
    Naturalidade: { type: DataTypes.STRING, allowNull: true },
    Nacionalidade: { type: DataTypes.STRING, allowNull: true },
    Religiao: { type: DataTypes.STRING, allowNull: true },
    NomePai: { type: DataTypes.STRING, allowNull: true },
    NomeMae: { type: DataTypes.STRING, allowNull: true },
    FormacaoAcademica: { type: DataTypes.STRING, allowNull: true },
    Ocupacao: { type: DataTypes.STRING, allowNull: true },
    LocalTrabalho: { type: DataTypes.STRING, allowNull: true },
    Situacao: { type: DataTypes.STRING, allowNull: true },
    Graduacao: { type: DataTypes.ENUM('Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'), allowNull: true },
    DataIniciacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de iniciação inválida.' } } },
    DataElevacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de elevação inválida.' } } },
    DataExaltacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de exaltação inválida.' } } },
    DataFiliacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de filiação inválida.' } } },
    DataRegularizacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de regularização inválida.' } } },
    SenhaHash: { type: DataTypes.STRING, allowNull: false },
    Funcao: { type: DataTypes.STRING, defaultValue: 'user', allowNull: true },
    credencialAcesso: { type: DataTypes.ENUM('Webmaster', 'Diretoria', 'Membro'), allowNull: false, defaultValue: 'Membro' },
    grauFilosofico: { type: DataTypes.STRING, allowNull: true },
    statusCadastro: { type: DataTypes.ENUM('Pendente', 'Aprovado', 'Rejeitado', 'VerificacaoEmailPendente'), allowNull: false, defaultValue: 'Pendente' },
    emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
    emailVerificationExpires: { type: DataTypes.DATE, allowNull: true },
    UltimoLogin: { type: DataTypes.DATE, allowNull: true },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  }, {
    timestamps: true,
    tableName: 'LodgeMembers',
    hooks: {
      beforeCreate: async (member) => {
        if (member.SenhaHash && (!member.SenhaHash.startsWith('$2a$') && !member.SenhaHash.startsWith('$2b$'))) {
          const salt = await bcrypt.genSalt(10);
          member.SenhaHash = await bcrypt.hash(member.SenhaHash, salt);
        }
      },
      beforeUpdate: async (member) => {
        if (member.changed('SenhaHash') && member.SenhaHash && (!member.SenhaHash.startsWith('$2a$') && !member.SenhaHash.startsWith('$2b$'))) {
          const salt = await bcrypt.genSalt(10);
          member.SenhaHash = await bcrypt.hash(member.SenhaHash, salt);
        }
      },
      afterCreate: async (membro, options) => {
          if (membro.statusCadastro === 'Pendente') {
              const { notificarNovoCadastroPendente } = await import('../services/notification.service.js');
              notificarNovoCadastroPendente(membro);
          }
      }
    }
  });

  LodgeMember.prototype.isValidPassword = async function (password) {
    if (!password || !this.SenhaHash) return false;
    try {
        return await bcrypt.compare(password, this.SenhaHash);
    } catch (error) {
        console.error("Erro ao comparar senhas:", error);
        return false;
    }
  };

  LodgeMember.associate = function(models) {
    // --- CORREÇÃO: Envolver cada associação numa verificação 'if' ---
    // Isto garante que a aplicação não falhe se um modelo não carregar corretamente.

    if (models.FamilyMember) {
      LodgeMember.hasMany(models.FamilyMember, { as: 'familiares', foreignKey: 'lodgeMemberId' });
    }
    if (models.MasonicSession && models.SessionAttendee) {
      LodgeMember.belongsToMany(models.MasonicSession, { through: models.SessionAttendee, as: 'sessoesPresente', foreignKey: 'lodgeMemberId', otherKey: 'sessionId' });
    }
    if (models.MasonicSession) {
      LodgeMember.hasMany(models.MasonicSession, { as: 'sessoesResponsavelJantar', foreignKey: 'responsavelJantarLodgeMemberId' });
    }
    if (models.CargoExercido) {
      LodgeMember.hasMany(models.CargoExercido, { as: 'cargos', foreignKey: 'lodgeMemberId' });
    }
    if (models.Publicacao) {
      LodgeMember.hasMany(models.Publicacao, { as: 'publicacoes', foreignKey: 'lodgeMemberId' });
    }
    if (models.Harmonia) {
      LodgeMember.hasMany(models.Harmonia, { as: 'harmonias', foreignKey: 'lodgeMemberId' });
    }
    if (models.Biblioteca) {
      LodgeMember.hasMany(models.Biblioteca, { as: 'livrosCadastrados', foreignKey: 'lodgeMemberId' });
    }
    if (models.Emprestimo) {
      LodgeMember.hasMany(models.Emprestimo, { as: 'emprestimos', foreignKey: 'membroId' });
    }
    if (models.Visita) {
      LodgeMember.hasMany(models.Visita, { as: 'visitas', foreignKey: 'lodgeMemberId' });
    }
    if (models.Condecoracao) {
      LodgeMember.hasMany(models.Condecoracao, { as: 'condecoracoes', foreignKey: 'lodgeMemberId' });
    }
    if (models.Comissao) {
      LodgeMember.hasMany(models.Comissao, { as: 'comissoesCriadas', foreignKey: 'criadorId' });
    }
    if (models.Comissao && models.MembroComissao) {
      LodgeMember.belongsToMany(models.Comissao, { through: models.MembroComissao, as: 'comissoes', foreignKey: 'lodgeMemberId', otherKey: 'comissaoId' });
    }
    if (models.Evento) {
      LodgeMember.hasMany(models.Evento, { as: 'eventosCriados', foreignKey: 'criadoPorId' });
    }
    if (models.Evento && models.ParticipanteEvento) {
      LodgeMember.belongsToMany(models.Evento, { through: models.ParticipanteEvento, as: 'eventosConfirmados', foreignKey: 'lodgeMemberId', otherKey: 'eventoId' });
    }
    // Adiciona a verificação para o novo modelo
    if (models.FotoEvento) {
        LodgeMember.hasMany(models.FotoEvento, { as: 'fotosEnviadas', foreignKey: 'uploaderId' });
    }
  };

  return LodgeMember;
};
