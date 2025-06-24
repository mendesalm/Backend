// models/locacaoSalao.model.js
export default (sequelize, DataTypes) => {
  const LocacaoSalao = sequelize.define(
    "LocacaoSalao",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      dataInicio: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dataFim: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      finalidade: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ehNaoOneroso: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Pode ser nulo se for não oneroso
      },
      status: {
        type: DataTypes.ENUM(
          "Pendente",
          "Confirmado",
          "Cancelado",
          "Concluído"
        ),
        defaultValue: "Pendente",
        allowNull: false,
      },
      lodgeMemberId: {
        // Para locatário que é membro da Loja
        type: DataTypes.INTEGER,
        allowNull: true, // Nulo se o locatário for externo
      },
      nomeLocatarioExterno: {
        // Para locatário que não é membro
        type: DataTypes.STRING,
        allowNull: true,
      },
      contatoLocatarioExterno: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lancamentoId: {
        // Link para o registro no financeiro
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "LocacoesSalao",
      timestamps: true,
    }
  );

  LocacaoSalao.associate = function (models) {
    this.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "locatarioMembro",
    });
    this.belongsTo(models.Lancamento, {
      foreignKey: "lancamentoId",
      as: "lancamentoFinanceiro",
    });
  };

  return LocacaoSalao;
};
