import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Configuracao extends Model {}
  Configuracao.init(
    {
      chave: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      valor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Configuracao",
      tableName: "Configuracoes",
      timestamps: false, // Geralmente não precisamos de timestamps para configurações
    }
  );
  return Configuracao;
};
