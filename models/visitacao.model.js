// models/visitacao.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Visita = sequelize.define(
    'Visita',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dataSessao: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tipoSessao: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lojaVisitada: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      orienteLojaVisitada: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'LodgeMembers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Se um membro for deletado, seus registros de visita também serão.
      },
    },
    {
      tableName: 'Visitas',
      timestamps: true,
    }
  );

  Visita.associate = (models) => {
    Visita.belongsTo(models.LodgeMember, {
      foreignKey: 'lodgeMemberId',
      as: 'visitante',
    });
  };

  return Visita;
};