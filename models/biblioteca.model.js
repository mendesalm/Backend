// models/biblioteca.model.js
export default (sequelize, DataTypes) => {
  const Biblioteca = sequelize.define('Biblioteca', {
    // ... (todos os seus campos existentes: id, titulo, autores, etc.) ...
    ISBN: { type: DataTypes.STRING, allowNull: true, unique: true },
    observacoes: { type: DataTypes.TEXT, allowNull: true },
    path: { type: DataTypes.STRING, allowNull: true },
    lodgeMemberId: { type: DataTypes.INTEGER, allowNull: true },
    // --- CAMPO ADICIONADO ---
    status: {
      type: DataTypes.ENUM('Disponível', 'Emprestado'),
      allowNull: false,
      defaultValue: 'Disponível',
      comment: 'Status atual do livro no acervo (se está disponível ou emprestado).',
    },
  }, { timestamps: true, tableName: 'Biblioteca' }); // Certifique-se de que tableName está correto

  Biblioteca.associate = function(models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: 'lodgeMemberId',
        as: 'cadastradoPor',
        onDelete: 'SET NULL',
      });
    }
    // Adicionar a nova associação
    if (models.Emprestimo) {
      Biblioteca.hasMany(models.Emprestimo, {
        foreignKey: 'livroId',
        as: 'historicoEmprestimos',
      });
    }
  };
  return Biblioteca;
};