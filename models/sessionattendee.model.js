// backend/models/sessionattendee.model.js
export default (sequelize, DataTypes) => {
  const SessionAttendee = sequelize.define(
    "SessionAttendee",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // As colunas de chave estrangeira (sessionId, lodgeMemberId) são gerenciadas pelas associações.

      // --- ADIÇÃO NECESSÁRIA AQUI ---
      statusPresenca: {
        type: DataTypes.ENUM("Presente", "Justificado", "Ausente"),
        allowNull: false,
        defaultValue: "Ausente",
      },
      // --- FIM DA ADIÇÃO ---
    },
    {
      timestamps: true,
      tableName: "SessionAttendees",
    }
  );

  // A associação não precisa de mudanças
  SessionAttendee.associate = function (models) {
    if (models.LodgeMember) {
      SessionAttendee.belongsTo(models.LodgeMember, {
        foreignKey: "lodgeMemberId",
      });
    }
    if (models.MasonicSession) {
      SessionAttendee.belongsTo(models.MasonicSession, {
        foreignKey: "sessionId",
      });
    }
  };

  return SessionAttendee;
};
