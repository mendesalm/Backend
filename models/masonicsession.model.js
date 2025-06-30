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
        type: DataTypes.ENUM("Ordinária", "Magna", "Especial", "Econômica"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "O tipo da sessão é obrigatório." },
          isIn: {
            args: [["Ordinária", "Magna", "Especial", "Econômica"]],
            msg: "Tipo de sessão inválido. Valores permitidos: Ordinária, Magna, Especial, Econômica.",
          },
        },
      },
      subtipoSessao: {
        type: DataTypes.ENUM("Aprendiz", "Companheiro", "Mestre", "Exaltação", "Iniciação", "Elevação", "Pública"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "O grau da sessão é obrigatório." },
          isIn: {
            args: [["Aprendiz", "Companheiro", "Mestre", "Exaltação", "Iniciação", "Elevação", "Pública"]],
            msg: "Subtipo de sessão inválido. Valores permitidos: Aprendiz, Companheiro, Mestre, Exaltação, Iniciação, Elevação, Pública.",
          },
        },
      },
      status: {
        type: DataTypes.ENUM("Agendada", "Realizada", "Cancelada"),
        allowNull: false,
        defaultValue: "Agendada",
        validate: {
          isIn: {
            args: [["Agendada", "Realizada", "Cancelada"]],
            msg: "Status inválido. Valores permitidos: Agendada, Realizada, Cancelada.",
          },
        },
      },
      responsabilidadeJantarId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "ResponsabilidadesJantar",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      troncoDeBeneficencia: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      conjugeResponsavelJantarNome: { type: DataTypes.STRING, allowNull: true },
      // responsavelJantarLodgeMemberId é FK
      classeSessao: {
        type: DataTypes.VIRTUAL,
        get() {
          const tipo = this.getDataValue("tipoSessao");
          const subtipo = this.getDataValue("subtipoSessao");
          if (!tipo || !subtipo) {
            return "";
          }
          
          // Define a classe da sessão com base no tipo e subtipo.
          // Sessões com subtipo "Pública" são tratadas de forma especial.
          if (subtipo === "Pública") {
            return `Sessão Pública (${tipo})`; // Ex: "Sessão Pública (Magna)"
          }
          
          // Para sessões ritualísticas, a classe inclui o grau.
          return `Sessão ${tipo} no Grau de ${subtipo} Maçom`; // Ex: "Sessão Ordinária no Grau de Aprendiz Maçom"
        },
      },
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
        MasonicSession.hasMany(models.SessionAttendee, {
          as: "attendees",
          foreignKey: "sessionId",
          onDelete: "CASCADE",
        });

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
