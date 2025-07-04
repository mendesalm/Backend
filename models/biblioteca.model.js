// models/biblioteca.model.js
export default (sequelize, DataTypes) => {
  const Biblioteca = sequelize.define(
    "Biblioteca",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: DataTypes.STRING, allowNull: false },
      autores: { type: DataTypes.STRING, allowNull: true },
      editora: { type: DataTypes.STRING, allowNull: true },
      anoPublicacao: { type: DataTypes.INTEGER, allowNull: true },
      ISBN: { type: DataTypes.STRING, allowNull: true, unique: true },
      numeroPaginas: { type: DataTypes.INTEGER, allowNull: true },
      // --- CORREÇÃO APLICADA AQUI ---
      classificacao: {
        type: DataTypes.ENUM("Aprendiz", "Companheiro", "Mestre"),
        allowNull: true,
      },
      // ---------------------------------
      observacoes: { type: DataTypes.TEXT, allowNull: true },
      path: { type: DataTypes.STRING, allowNull: true },
      lodgeMemberId: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM(
          "Disponível",
          "Emprestado",
          "Manutenção",
          "Perdido",
          "Reservado"
        ),
        allowNull: false,
        defaultValue: "Disponível",
      },
    },
    { timestamps: true, tableName: "Biblioteca" }
  );

  Biblioteca.associate = function (models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: "lodgeMemberId",
        as: "cadastradoPor",
        onDelete: "SET NULL",
      });
    }
    if (models.Emprestimo) {
      Biblioteca.hasMany(models.Emprestimo, {
        foreignKey: "livroId",
        as: "historicoEmprestimos",
      });
    }
  };
  return Biblioteca;
};
