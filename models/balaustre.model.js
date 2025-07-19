import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Balaustre extends Model {
    static associate(models) {
      Balaustre.belongsTo(models.MasonicSession, {
        foreignKey: "MasonicSessionId",
        as: "session",
      });
    }
  }
  Balaustre.init(
    {
      // Campos legados que são obrigatórios no banco
      numero: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ano: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // --- CORREÇÃO AQUI ---
      // O campo 'path' foi adicionado para corresponder à estrutura da tabela.
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // --- FIM DA CORREÇÃO ---

      // Novos campos
      googleDocId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      caminhoPdfLocal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dadosFormulario: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      MasonicSessionId: { type: DataTypes.INTEGER, allowNull: false },
      
      // --- NOVOS CAMPOS ADICIONADOS ---
      status: {
        type: DataTypes.ENUM('Rascunho', 'Assinado'),
        allowNull: false,
        defaultValue: 'Rascunho',
      },
      assinaturas: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "Balaustre",
      tableName: "Balaustres",
    }
  );
  return Balaustre;
};
