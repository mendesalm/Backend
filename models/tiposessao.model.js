// models/tiposessao.model.js
export default (sequelize, DataTypes) => {
  const TipoSessao = sequelize.define(
    "TipoSessao",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING, allowNull: false, unique: true },
      descricao: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "TiposSessao",
      timestamps: true,
    }
  );

  TipoSessao.associate = function (models) {
    TipoSessao.belongsToMany(models.Playlist, {
      through: models.TipoSessaoPlaylist,
      foreignKey: "tipoSessaoId",
      otherKey: "playlistId",
      as: "playlists",
    });
  };

  return TipoSessao;
};
