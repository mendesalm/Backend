// models/emprestimoPatrimonio.model.js
export default (sequelize, DataTypes) => {
  const EmprestimoPatrimonio = sequelize.define(
    "EmprestimoPatrimonio",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      dataRetirada: { type: DataTypes.DATE, allowNull: false },
      dataDevolucaoPrevista: { type: DataTypes.DATE, allowNull: false },
      dataDevolucaoReal: { type: DataTypes.DATE, allowNull: true },
      finalidade: { type: DataTypes.TEXT, allowNull: true },
      ehNaoOneroso: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      valorCobrado: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      status: {
        type: DataTypes.ENUM(
          "Solicitado",
          "Aprovado",
          "Retirado",
          "Devolvido",
          "Cancelado"
        ),
        defaultValue: "Solicitado",
        allowNull: false,
      },
      lodgeMemberId: { type: DataTypes.INTEGER, allowNull: true },
      nomeLocatarioExterno: { type: DataTypes.STRING, allowNull: true },
      contatoLocatarioExterno: { type: DataTypes.STRING, allowNull: true },
      lancamentoId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "EmprestimosPatrimonio",
      timestamps: true,
    }
  );

  EmprestimoPatrimonio.associate = function (models) {
    this.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "locatarioMembro",
    });
    this.belongsTo(models.Lancamento, {
      foreignKey: "lancamentoId",
      as: "lancamentoFinanceiro",
    });
    // Associação com os itens através da tabela de junção
    this.belongsToMany(models.Patrimonio, {
      through: models.ItemEmprestimoPatrimonio,
      foreignKey: "emprestimoId",
      as: "itens",
    });
  };

  return EmprestimoPatrimonio;
};
