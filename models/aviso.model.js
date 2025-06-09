// models/aviso.model.js
export default (sequelize, DataTypes) => {
  const Aviso = sequelize.define('Aviso', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "O título do aviso é obrigatório." } } },
    conteudo: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: { msg: "O conteúdo do aviso é obrigatório." } } },
    dataExpiracao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
    fixado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    timestamps: true,
    tableName: 'Avisos',
  });

  Aviso.associate = function(models) {
    Aviso.belongsTo(models.LodgeMember, {
      as: 'autor',
      foreignKey: { name: 'autorId', allowNull: true }
    });
  };

  return Aviso;
};
