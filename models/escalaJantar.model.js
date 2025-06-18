import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class EscalaJantar extends Model {
    static associate(models) {
      EscalaJantar.belongsTo(models.LodgeMember, {
        foreignKey: "membroId",
        as: "membro",
      });
    }
  }
  EscalaJantar.init(
    {
      ordem: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ativo", "pulado"),
        defaultValue: "ativo",
        allowNull: false,
      },
      membroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "LodgeMembers", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "EscalaJantar",
      tableName: "EscalaJantares",
    }
  );
  return EscalaJantar;
};
