// models/comissao.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Comissao = sequelize.define(
    'Comissao',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: DataTypes.STRING, allowNull: false, unique: true },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      tipo: { type: DataTypes.ENUM('Permanente', 'Temporária'), allowNull: false },
      dataInicio: { type: DataTypes.DATEONLY, allowNull: false },
      dataFim: { type: DataTypes.DATEONLY, allowNull: false },
      criadorId: { // Membro que registrou a comissão
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'LodgeMembers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'Comissoes',
      timestamps: true,
    }
  );

  Comissao.associate = (models) => {
    // Membros pertencentes a esta comissão (relação N:M)
    Comissao.belongsToMany(models.LodgeMember, {
      through: models.MembroComissao,
      foreignKey: 'comissaoId',
      otherKey: 'lodgeMemberId',
      as: 'membros',
    });

    // Criador da comissão
    Comissao.belongsTo(models.LodgeMember, {
      foreignKey: 'criadorId',
      as: 'criador',
    });
  };

  return Comissao;
};