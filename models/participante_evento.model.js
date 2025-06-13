// models/participante_evento.model.js
export default (sequelize, DataTypes) => {
  const ParticipanteEvento = sequelize.define(
    "ParticipanteEvento",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      statusConfirmacao: {
        type: DataTypes.ENUM("Confirmado", "Pendente", "Recusado"),
        allowNull: false,
        defaultValue: "Pendente",
      },
      dataConfirmacao: { type: DataTypes.DATE, allowNull: true },
      acompanhantes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "ParticipantesEvento",
      timestamps: false,
    }
  );
  return ParticipanteEvento;
};
