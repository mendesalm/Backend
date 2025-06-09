// models/conta.model.js
export default (sequelize, DataTypes) => {
  const Conta = sequelize.define('Conta', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: "O nome da conta é obrigatório." } } },
    tipo: { type: DataTypes.ENUM('Receita', 'Despesa'), allowNull: false, validate: { notEmpty: { msg: "O tipo da conta (Receita/Despesa) é obrigatório." } } },
    descricao: { type: DataTypes.TEXT, allowNull: true },
  }, {
    timestamps: true,
    tableName: 'Contas',
  });

  Conta.associate = function(models) {
    Conta.hasMany(models.Lancamento, { as: 'lancamentos', foreignKey: 'contaId' });
    Conta.hasMany(models.Orcamento, { as: 'orcamentos', foreignKey: 'contaId' });
  
  };

  return Conta;
};