// models/tiposessaoplaylist.model.js
export default (sequelize, DataTypes) => {
  const TipoSessaoPlaylist = sequelize.define(
    "TipoSessaoPlaylist",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "TipoSessaoPlaylists",
      timestamps: true,
    }
  );
  return TipoSessaoPlaylist;
};
