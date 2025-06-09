// backend/models/masonicsession.model.js
export default (sequelize, DataTypes) => {
  const MasonicSession = sequelize.define('MasonicSession', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dataSessao: { type: DataTypes.DATEONLY, allowNull: false, validate: { notEmpty: { msg: "Data da sessão é obrigatória." }, isDate: { msg: "Data da sessão inválida." } } },
    tipoSessao: { type: DataTypes.ENUM('Ordinária', 'Magna'), allowNull: false, validate: { notEmpty: { msg: "Tipo de sessão é obrigatório." } } },
    subtipoSessao: { type: DataTypes.ENUM('Aprendiz', 'Companheiro', 'Mestre', 'Pública'), allowNull: false, validate: { notEmpty: { msg: "Subtipo de sessão é obrigatório." } } },
    troncoDeBeneficencia: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    conjugeResponsavelJantarNome: { type: DataTypes.STRING, allowNull: true },
    // responsavelJantarLodgeMemberId é FK
  }, {
    timestamps: true,
    tableName: 'MasonicSessions',
  });

  MasonicSession.associate = function(models) {
    if (models.LodgeMember) {
      MasonicSession.belongsTo(models.LodgeMember, {
        as: 'responsavelJantar',
        foreignKey: { name: 'responsavelJantarLodgeMemberId', allowNull: true },
      });
      if (models.SessionAttendee) {
        MasonicSession.belongsToMany(models.LodgeMember, {
          through: models.SessionAttendee,
          as: 'presentes',
          foreignKey: 'sessionId',
          otherKey: 'lodgeMemberId',
        });
      } else {
        console.error("MODELO AUSENTE: SessionAttendee em MasonicSession.belongsToMany(LodgeMember).");
      }
    } else {
      console.error("MODELO AUSENTE: LodgeMember em MasonicSession.");
    }

    if (models.Ata) {
      MasonicSession.hasOne(models.Ata, {
        as: 'ata',
        foreignKey: { name: 'sessionId', allowNull: false },
        onDelete: 'CASCADE'
      });
    } else {
      console.error("MODELO AUSENTE: Ata em MasonicSession.");
    }

    // NOVA ASSOCIAÇÃO
    if (models.VisitanteSessao) {
      MasonicSession.hasMany(models.VisitanteSessao, {
        as: 'visitantes', // Alias para acessar os visitantes da sessão
        foreignKey: {
          name: 'masonicSessionId', // Chave estrangeira na tabela VisitantesSessao
          allowNull: false,
        },
        onDelete: 'CASCADE'
      });
    } else {
      console.error("MODELO AUSENTE: VisitanteSessao não pôde ser associado em MasonicSession.");
    }
  };
  return MasonicSession;
};