// backend/models/sessionattendee.model.js
export default (sequelize, DataTypes) => {
  const SessionAttendee = sequelize.define('SessionAttendee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    // As colunas sessionId e lodgeMemberId são criadas pela migração e
    // gerenciadas pelas associações belongsToMany nos modelos LodgeMember e MasonicSession.
    // Não é necessário definir 'associate' aqui se ele for apenas uma tabela de junção simples.
  }, {
    timestamps: true,
    tableName: 'SessionAttendees',
  });

  // SessionAttendee.associate = function(models) {
  //   // Se precisar de associações explícitas PARA o modelo SessionAttendee:
  //   if (models.LodgeMember) {
  //     SessionAttendee.belongsTo(models.LodgeMember, { foreignKey: 'lodgeMemberId' });
  //   }
  //   if (models.MasonicSession) {
  //     SessionAttendee.belongsTo(models.MasonicSession, { foreignKey: 'sessionId' });
  //   }
  // };
  return SessionAttendee;
};