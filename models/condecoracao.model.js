// models/condecoracao.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Condecoracao = sequelize.define(
    "Condecoracao",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dataRecebimento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "LodgeMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Se um membro for deletado, suas condecorações também serão.
      },
    },
    {
      tableName: "Condecoracoes",
      timestamps: true,
    }
  );

  Condecoracao.associate = (models) => {
    Condecoracao.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "membroCondecorado",
    });
  };

  return Condecoracao;
};
