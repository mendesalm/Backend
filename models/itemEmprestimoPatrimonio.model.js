// models/itemEmprestimoPatrimonio.model.js
export default (sequelize, DataTypes) => {
  const ItemEmprestimoPatrimonio = sequelize.define(
    "ItemEmprestimoPatrimonio",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      emprestimoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "EmprestimosPatrimonio", key: "id" },
      },
      patrimonioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Patrimonios", key: "id" },
      },
      quantidadeEmprestada: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "ItensEmprestimoPatrimonio",
      timestamps: false,
    }
  );
  return ItemEmprestimoPatrimonio;
};
