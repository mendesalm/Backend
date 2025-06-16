// models/musica.model.js
export default (sequelize, DataTypes) => {
  const Musica = sequelize.define(
    "Musica",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      autor: { type: DataTypes.STRING, allowNull: true },
      path: { type: DataTypes.STRING, allowNull: true },
      // A coluna 'playlistId' será gerenciada pela associação abaixo
    },
    {
      tableName: "Musicas",
      timestamps: true,
    }
  );

  Musica.associate = function (models) {
    // Uma Música pertence a uma Playlist
    Musica.belongsTo(models.Playlist, {
      foreignKey: "playlistId",
      as: "playlist",
    });
  };

  return Musica;
};
