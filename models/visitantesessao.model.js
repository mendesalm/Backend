// backend/models/visitantesessao.model.js
export default (sequelize, DataTypes) => {
  const VisitanteSessao = sequelize.define(
    "VisitanteSessao",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nomeCompleto: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "O nome completo do visitante é obrigatório." },
        },
      },
      graduacao: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cim: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // --- CAMPO ADICIONADO ---
      lojaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lojas",
          key: "id",
        },
      },
      // --- CAMPOS ANTIGOS (REMOVIDOS DO MODELO) ---
      // potencia: DataTypes.STRING,
      // loja: DataTypes.STRING,
      // oriente: DataTypes.STRING,
    },
    {
      timestamps: true,
      tableName: "VisitantesSessao",
    }
  );

  VisitanteSessao.associate = function (models) {
    if (models.MasonicSession) {
      VisitanteSessao.belongsTo(models.MasonicSession, {
        as: "sessao",
        foreignKey: {
          name: "masonicSessionId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });
    }

    // --- NOVA ASSOCIAÇÃO ---
    if (models.Loja) {
      VisitanteSessao.belongsTo(models.Loja, {
        foreignKey: "lojaId",
        as: "loja",
      });
    }
  };

  return VisitanteSessao;
};
