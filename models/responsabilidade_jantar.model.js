// models/responsabilidade_jantar.model.js
export default (sequelize, DataTypes) => {
  const ResponsabilidadeJantar = sequelize.define(
    "ResponsabilidadeJantar",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM("Ativo", "Pausado", "Cumprido"),
        allowNull: false,
        defaultValue: "Ativo",
      },
      // --- CORREÇÃO ADICIONADA AQUI ---
      // Declaramos explicitamente as colunas de chave estrangeira
      // para que o Sequelize saiba que elas fazem parte do modelo.
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "LodgeMembers",
          key: "id",
        },
      },
      sessaoDesignadaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "MasonicSessions",
          key: "id",
        },
      },
    },
    {
      tableName: "ResponsabilidadesJantar",
      timestamps: true,
    }
  );

  ResponsabilidadeJantar.associate = function (models) {
    ResponsabilidadeJantar.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "membro",
    });
    ResponsabilidadeJantar.belongsTo(models.MasonicSession, {
      foreignKey: "sessaoDesignadaId",
      as: "sessaoDesignada",
    });
  };

  return ResponsabilidadeJantar;
};
