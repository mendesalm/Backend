// backend/models/harmonia.model.js
export default (sequelize, DataTypes) => {
  const Harmonia = sequelize.define('Harmonia', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    categoria: { type: DataTypes.STRING, allowNull: true },
    subcategoria: { type: DataTypes.STRING, allowNull: true },
    titulo: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Título é obrigatório." } } },
    autor: { type: DataTypes.STRING, allowNull: true },
    path: { type: DataTypes.STRING, allowNull: true }, // Caminho para arquivo de áudio ou URL
    lodgeMemberId: { // Para rastrear quem fez o upload/cadastrou
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, { timestamps: true, tableName: 'Harmonia' });

  Harmonia.associate = function(models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: 'lodgeMemberId',
        as: 'cadastradoPor',
        allowNull: true,
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  };
  return Harmonia;
};