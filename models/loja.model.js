// models/loja.model.js
export default (sequelize, DataTypes) => {
  const Loja = sequelize.define(
    "Loja",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING, allowNull: false },
      numero: { type: DataTypes.INTEGER, allowNull: true },
      cidade: { type: DataTypes.STRING, allowNull: true },
      estado: { type: DataTypes.STRING(2), allowNull: true },
      potencia: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "Lojas",
      timestamps: true,
    }
  );

  Loja.associate = (models) => {
    // Uma loja pode ter vários registros de visitas feitas por nossos membros
    if (models.Visita) {
      Loja.hasMany(models.Visita, { foreignKey: "lojaId" });
    }
    // Uma loja pode ter vários registros de seus membros nos visitando
    if (models.VisitanteSessao) {
      Loja.hasMany(models.VisitanteSessao, { foreignKey: "lojaId" });
    }
  };

  return Loja;
};
