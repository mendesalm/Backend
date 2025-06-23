// models/legislacao.model.js

// Adotando o seu padrão de exportar uma função anônima
export default (sequelize, DataTypes) => {
  const Legislacao = sequelize.define(
    "Legislacao",
    {
      // A definição do ID é opcional, o Sequelize a cria por padrão.
      // Manterei para ficar idêntico ao seu padrão.
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "O campo título não pode ser vazio." },
        },
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
        type: DataTypes.DATEONLY, // Usando DATEONLY como no seu modelo publicacoes
        defaultValue: DataTypes.NOW,
      },
      // Campo para associar ao membro que fez o upload
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "Legislacoes",
      timestamps: true,
    }
  );

  // Incluindo o método associate, seguindo o seu padrão
  Legislacao.associate = function (models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: "lodgeMemberId",
        as: "autor", // Um alias para a relação
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  };

  return Legislacao;
};
