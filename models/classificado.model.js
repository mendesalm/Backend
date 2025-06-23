// models/classificado.model.js
export default (sequelize, DataTypes) => {
  const Classificado = sequelize.define(
    "Classificado",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "O título é obrigatório." } },
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tipoAnuncio: {
        type: DataTypes.ENUM("Venda", "Compra", "Aluguel", "Doação", "Serviço"),
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Nulo para doações, serviços, etc.
      },
      contato: {
        type: DataTypes.STRING,
        allowNull: true, // Telefone, email, etc.
      },
      lodgeMemberId: {
        // Chave estrangeira para o autor
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "Classificados",
      timestamps: true,
    }
  );

  Classificado.associate = function (models) {
    // Um classificado pertence a um membro (o anunciante)
    this.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "anunciante",
      onDelete: "CASCADE", // Se o membro for deletado, seus anúncios também são
    });
    // Um classificado pode ter muitas fotos
    this.hasMany(models.FotoClassificado, {
      foreignKey: "classificadoId",
      as: "fotos",
      onDelete: "CASCADE", // Se o anúncio for deletado, suas fotos também são
    });
  };

  return Classificado;
};
