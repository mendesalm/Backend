// models/patrimonio.model.js
export default (sequelize, DataTypes) => {
  const Patrimonio = sequelize.define(
    "Patrimonio",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "O nome do item é obrigatório." } },
      },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      dataAquisicao: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { isDate: true },
      },
      valorAquisicao: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { isDecimal: true, min: 0 },
      },

      // --- INÍCIO DA ADIÇÃO ---
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      // --- FIM DA ADIÇÃO ---

      estadoConservacao: {
        type: DataTypes.ENUM(
          "Novo",
          "Bom",
          "Regular",
          "Necessita Reparo",
          "Inservível"
        ),
        allowNull: false,
        defaultValue: "Bom",
      },
      localizacao: { type: DataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true,
      tableName: "Patrimonios",
    }
  );

  Patrimonio.associate = function (models) {
    Patrimonio.belongsTo(models.LodgeMember, {
      as: "registradoPor",
      foreignKey: { name: "registradoPorId", allowNull: true },
    });
  };

  return Patrimonio;
};
