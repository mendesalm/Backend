// models/orcamento.model.js
export default (sequelize, DataTypes) => {
  const Orcamento = sequelize.define('Orcamento', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ano: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true } },
    valorOrcado: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { isDecimal: true, min: 0 } },
  }, {
    timestamps: true,
    tableName: 'Orcamentos',
    indexes: [ { unique: true, fields: ['ano', 'contaId'] } ] // Garante a unicidade
  });

  Orcamento.associate = function(models) {
    Orcamento.belongsTo(models.Conta, { as: 'conta', foreignKey: { name: 'contaId', allowNull: false } });
  };

  return Orcamento;
};
