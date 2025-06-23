// models/fotoClassificado.model.js
export default (sequelize, DataTypes) => {
  const FotoClassificado = sequelize.define(
    "FotoClassificado",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      caminhoArquivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      classificadoId: {
        // Chave estrangeira para o classificado
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "FotosClassificados",
      timestamps: false, // Geralmente não precisamos de timestamps para fotos
    }
  );

  FotoClassificado.associate = function (models) {
    this.belongsTo(models.Classificado, {
      foreignKey: "classificadoId",
      as: "classificado",
    });
  };

  return FotoClassificado;
};
