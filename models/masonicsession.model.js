export default (sequelize, DataTypes) => {
  const MasonicSession = sequelize.define(
    "MasonicSession",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      dataSessao: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Data da sessão é obrigatória." },
          isDate: { msg: "Data da sessão inválida." },
        },
      },
      tipoSessao: {
        type: DataTypes.ENUM("Ordinária", "Magna"),
        allowNull: false,
        validate: { notEmpty: { msg: "Tipo de sessão é obrigatório." } },
      },
      subtipoSessao: {
        type: DataTypes.ENUM("Aprendiz", "Companheiro", "Mestre", "Pública"),
        allowNull: false,
        validate: { notEmpty: { msg: "Subtipo de sessão é obrigatório." } },
      },
      troncoDeBeneficencia: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      conjugeResponsavelJantarNome: { type: DataTypes.STRING, allowNull: true },
      // responsavelJantarLodgeMemberId é FK
    },
    {
      timestamps: true,
      tableName: "MasonicSessions",
    }
  );

  MasonicSession.associate = function (models) {
    // --- ASSOCIAÇÃO COM LodgeMember (Inalterada) ---
    if (models.LodgeMember) {
      MasonicSession.belongsTo(models.LodgeMember, {
        as: "responsavelJantar",
        foreignKey: { name: "responsavelJantarLodgeMemberId", allowNull: true },
      });
      if (models.SessionAttendee) {
        MasonicSession.belongsToMany(models.LodgeMember, {
          through: models.SessionAttendee,
          as: "presentes",
          foreignKey: "sessionId",
          otherKey: "lodgeMemberId",
        });
      } else {
        console.error(
          "MODELO AUSENTE: SessionAttendee em MasonicSession.belongsToMany(LodgeMember)."
        );
      }
    } else {
      console.error("MODELO AUSENTE: LodgeMember em MasonicSession.");
    }

    // --- ASSOCIAÇÃO COM VisitanteSessao (Inalterada) ---
    if (models.VisitanteSessao) {
      MasonicSession.hasMany(models.VisitanteSessao, {
        as: "visitantes",
        foreignKey: {
          name: "masonicSessionId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });
    } else {
      console.error(
        "MODELO AUSENTE: VisitanteSessao não pôde ser associado em MasonicSession."
      );
    }

    if (models.ResponsabilidadeJantar) {
      MasonicSession.hasMany(models.ResponsabilidadeJantar, {
        as: "responsaveisJantar",
        foreignKey: {
          name: "sessaoDesignadaId",
          allowNull: true,
        },
      });
    } else {
      console.error(
        "MODELO AUSENTE: ResponsabilidadeJantar não pôde ser associado em MasonicSession."
      );
    }

    if (models.Balaustre) {
      MasonicSession.hasOne(models.Balaustre, {
        as: "Balaustre", // Alias para acessar o balaústre da sessão
        foreignKey: { name: "MasonicSessionId", allowNull: false },
        onDelete: "CASCADE",
      });
    } else {
      console.error("MODELO AUSENTE: Balaustre em MasonicSession.");
    }
  };

  return MasonicSession;
};
