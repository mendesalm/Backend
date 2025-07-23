export default (sequelize, DataTypes) => {
  const MasonicSession = sequelize.define(
    "MasonicSession",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      numero: { type: DataTypes.INTEGER, allowNull: true },
      dataSessao: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Data da sessão é obrigatória." },
          isDate: { msg: "Data da sessão inválida." },
        },
      },
      tipoSessao: {
        type: DataTypes.ENUM("Ordinária", "Magna", "Publica", "Especial"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "O tipo da sessão é obrigatório." },
          isIn: {
            args: [["Ordinária", "Magna", "Publica", "Especial"]],
            msg: "Tipo de sessão inválido. Valores permitidos: Ordinária, Magna, Publica, Especial.",
          },
        },
      },
      subtipoSessao: {
        type: DataTypes.ENUM("Aprendiz", "Companheiro", "Mestre", "Instalação e Posse", "Comemorativa", "Iniciação", "Elevação", "Exaltação"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "O grau da sessão é obrigatório." },
          isIn: {
            args: [["Aprendiz", "Companheiro", "Mestre", "Instalação e Posse", "Comemorativa", "Iniciação", "Elevação", "Exaltação"]],
            msg: "Subtipo de sessão inválido. Valores permitidos: Aprendiz, Companheiro, Mestre, Instalação e Posse, Comemorativa, Iniciação, Elevação, Exaltação.",
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
      tipoResponsabilidadeJantar: {
        type: DataTypes.ENUM("Sequencial", "Institucional", "Especial"),
        allowNull: false,
        defaultValue: "Sequencial",
      },
      troncoDeBeneficencia: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      conjugeResponsavelJantarNome: { type: DataTypes.STRING, allowNull: true },
      caminhoEditalPdf: { type: DataTypes.STRING, allowNull: true },
      caminhoBalaustrePdf: { type: DataTypes.STRING, allowNull: true },
      caminhoConvitePdf: { type: DataTypes.STRING, allowNull: true },
      balaustreId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Balaustres',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    // Nova associação com Balaustre
    if (models.Balaustre) {
      MasonicSession.belongsTo(models.Balaustre, {
        as: "balaustre",
        foreignKey: { name: "balaustreId", allowNull: true },
      });
    } else {
      console.error("MODELO AUSENTE: Balaustre não pôde ser associado em MasonicSession.");
    }
  };

  return MasonicSession;
};
