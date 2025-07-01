import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class DocumentoGerado extends Model {}

  DocumentoGerado.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('Prancha', 'Convite', 'Cartão'),
      allowNull: false,
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: true, // Apenas para pranchas
    },
    ano: {
      type: DataTypes.INTEGER,
      allowNull: true, // Apenas para pranchas
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lodgeMemberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'LodgeMembers',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'DocumentoGerado',
    tableName: 'DocumentosGerados',
    timestamps: true,
  });

  DocumentoGerado.associate = (models) => {
    DocumentoGerado.belongsTo(models.LodgeMember, { foreignKey: 'lodgeMemberId', as: 'lodgeMember' });
  };

  return DocumentoGerado;
};