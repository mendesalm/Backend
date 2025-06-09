// backend/models/ata.model.js
export default (sequelize, DataTypes) => {
  const Ata = sequelize.define('Ata', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "O número da ata é obrigatório." } } },
    ano: { type: DataTypes.INTEGER, allowNull: false, validate: { notEmpty: { msg: "O ano da ata é obrigatório." }, isInt: { msg: "O ano da ata deve ser um número." } } },
    dataDeAprovacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: "Data de aprovação inválida."} } },
    path: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Caminho do arquivo da ata é obrigatório." } } },
    // sessionId é FK
  }, {
    timestamps: true,
    tableName: 'Atas',
  });

  Ata.associate = function(models) {
    if (models.MasonicSession) {
      Ata.belongsTo(models.MasonicSession, {
        foreignKey: { name: 'sessionId', allowNull: false, unique: true }, // unique:true para 1-para-1
        onDelete: 'CASCADE',
      });
    } else {
      console.error("MODELO AUSENTE: MasonicSession não pôde ser associado em Ata.");
    }
  };
  return Ata;
};