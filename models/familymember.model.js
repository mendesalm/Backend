// backend/models/familymember.model.js
export default (sequelize, DataTypes) => {
  const FamilyMember = sequelize.define(
    "FamilyMember",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nomeCompleto: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "O nome completo do familiar é obrigatório." },
        },
      },
      parentesco: {
        type: DataTypes.ENUM("Cônjuge", "Esposa", "Filho", "Filha"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Parentesco é obrigatório." },
          isIn: {
            args: [["Cônjuge", "Esposa", "Filho", "Filha"]],
            msg: "Parentesco inválido.",
          },
        },
      },
      dataNascimento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Data de nascimento é obrigatória." },
          isDate: { msg: "Data de nascimento inválida." },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: { isEmail: { msg: "Email do familiar inválido." } },
      },
      telefone: { type: DataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true,
      tableName: "FamilyMembers",
    }
  );

  FamilyMember.associate = function (models) {
    if (models.LodgeMember) {
      FamilyMember.belongsTo(models.LodgeMember, {
        foreignKey: { name: "lodgeMemberId", allowNull: false },
        onDelete: "CASCADE",
        as: "membro",
      });
    } else {
      console.error(
        "MODELO AUSENTE: LodgeMember não pôde ser associado em FamilyMember."
      );
    }
  };
  return FamilyMember;
};
