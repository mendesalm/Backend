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
      potencia: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      loja: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      oriente: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "VisitantesSessao",
    }
  );

  VisitanteSessao.associate = function (models) {
    if (models.MasonicSession) {
      // --- CORREÇÃO APLICADA AQUI ---
      // Adiciona o alias 'sessao' para corresponder à associação inversa
      // definida no modelo MasonicSession (que usa o alias 'visitantes').
      VisitanteSessao.belongsTo(models.MasonicSession, {
        as: "sessao",
        foreignKey: {
          name: "masonicSessionId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });
    } else {
      console.error(
        "MODELO AUSENTE: MasonicSession não pôde ser associado em VisitanteSessao."
      );
    }
  };

  return VisitanteSessao;
};
