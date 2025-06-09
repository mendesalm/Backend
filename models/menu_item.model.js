// models/menu_item.model.js
export default (sequelize, DataTypes) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    label: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING },
    path: { type: DataTypes.STRING, allowNull: false, unique: true },
    ordem: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: 'MenuItems', timestamps: true });

  MenuItem.associate = function(models) {
    MenuItem.belongsTo(models.FuncionalidadePermissao, { as: 'permissao', foreignKey: { name: 'requiredFeature', field: 'requiredFeature', allowNull: false }, targetKey: 'nomeFuncionalidade' });
    MenuItem.hasMany(models.MenuItem, { as: 'children', foreignKey: 'parentId' });
    MenuItem.belongsTo(models.MenuItem, { as: 'parent', foreignKey: 'parentId' });
  };
  return MenuItem;
};