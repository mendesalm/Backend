// models/foto_evento.model.js
export default (sequelize, DataTypes) => {
  const FotoEvento = sequelize.define('FotoEvento', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    path: { type: DataTypes.STRING, allowNull: false },
    legenda: { type: DataTypes.STRING, allowNull: true },
  }, {
    timestamps: true,
    tableName: 'FotosEvento',
  });

  FotoEvento.associate = function(models) {
    // Adiciona uma verificação para garantir que o modelo Evento existe antes de criar a associação
    if (models.Evento) {
      FotoEvento.belongsTo(models.Evento, { as: 'evento', foreignKey: 'eventoId' });
    }
    
    // Adiciona uma verificação para garantir que o modelo LodgeMember existe antes de criar a associação
    if (models.LodgeMember) {
      FotoEvento.belongsTo(models.LodgeMember, { as: 'uploader', foreignKey: 'uploaderId' });
    }
  };

  return FotoEvento;
};
