// backend/models/publicacao.model.js
export default (sequelize, DataTypes) => {
  const Publicacao = sequelize.define('Publicacao', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    data: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    tema: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Tema é obrigatório." } } },
    nome: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Nome da publicação é obrigatório." } } },
    grau: { type: DataTypes.STRING, allowNull: true }, // Ex: Aprendiz, Companheiro, Mestre, etc.
    path: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Caminho do arquivo é obrigatório." } } },
    lodgeMemberId: { // Para rastrear quem fez o upload/criou
      type: DataTypes.INTEGER,
      allowNull: true, // Pode ser uma publicação geral não atrelada a um membro específico
                       // Se for sempre de um membro, mude para allowNull: false
    }
  }, { timestamps: true, tableName: 'Publicacoes' });

  Publicacao.associate = function(models) {
    // A associação só é criada se a coluna lodgeMemberId existir no modelo Publicacao
    // e se o modelo LodgeMember existir no objeto 'models'.
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: 'lodgeMemberId',
        as: 'autorOuUploader', // Escolha um alias apropriado
        allowNull: true,      // A FK em si pode ser nula
        onDelete: 'SET NULL', // Se o membro for deletado, a publicação permanece, mas sem autor/uploader
        onUpdate: 'CASCADE'
      });
    }
  };
  return Publicacao;
};