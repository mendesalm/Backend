// models/arquivoDiverso.model.js
export default (sequelize, DataTypes) => {
  const ArquivoDiverso = sequelize.define(
    "ArquivoDiverso",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "O campo título não pode ser vazio." } },
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      caminhoArquivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nomeOriginalArquivo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dataPublicacao: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
      },
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "ArquivosDiversos", // Nome da tabela
      timestamps: true,
    }
  );

  ArquivoDiverso.associate = function (models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: "lodgeMemberId",
        as: "autor",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  };

  return ArquivoDiverso;
};
