// models/lancamento.model.js
export default (sequelize, DataTypes) => {
  const Lancamento = sequelize.define('Lancamento', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    descricao: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "A descrição do lançamento é obrigatória." } } },
    valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { isDecimal: true, notNull: true, min: 0.01 } },
    dataLancamento: { type: DataTypes.DATEONLY, allowNull: false, validate: { isDate: true, notNull: true } },
    comprovanteUrl: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: { msg: 'URL do comprovante inválida.', require_protocol: true } } },
  }, {
    timestamps: true,
    tableName: 'Lancamentos',
  });

  Lancamento.associate = function(models) {
    Lancamento.belongsTo(models.Conta, { as: 'conta', foreignKey: { name: 'contaId', allowNull: false } });
    Lancamento.belongsTo(models.LodgeMember, { as: 'membroAssociado', foreignKey: { name: 'membroId', allowNull: true } });
    Lancamento.belongsTo(models.LodgeMember, { as: 'criadoPor', foreignKey: { name: 'criadoPorId', allowNull: false } });
  };

  return Lancamento;
};