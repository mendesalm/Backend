// models/reserva.model.js
export default (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dataReserva: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('Ativa', 'Notificada', 'Atendida', 'Expirada', 'Cancelada'), allowNull: false, defaultValue: 'Ativa' },
    notificadoEm: { type: DataTypes.DATE, allowNull: true },
    reservaExpiraEm: { type: DataTypes.DATE, allowNull: true },
  }, { timestamps: true, tableName: 'Reservas' });

  Reserva.associate = function(models) {
    Reserva.belongsTo(models.Biblioteca, { as: 'livro', foreignKey: 'livroId' });
    Reserva.belongsTo(models.LodgeMember, { as: 'membro', foreignKey: 'membroId' });
  };
  return Reserva;
};