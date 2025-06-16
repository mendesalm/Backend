// models/playlist.model.js
export default (sequelize, DataTypes) => {
  const Playlist = sequelize.define(
    "Playlist",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING, allowNull: false, unique: true },
      descricao: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "Playlists",
      timestamps: true,
    }
  );

  Playlist.associate = function (models) {
    Playlist.hasMany(models.Musica, {
      as: "musicas",
      foreignKey: "playlistId",
    });
    Playlist.belongsToMany(models.TipoSessao, {
      through: models.TipoSessaoPlaylist,
      foreignKey: "playlistId",
      otherKey: "tipoSessaoId",
      as: "tiposSessao",
    });
  };

  return Playlist;
};
