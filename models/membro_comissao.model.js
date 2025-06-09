// models/membro_comissao.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const MembroComissao = sequelize.define(
    'MembroComissao',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      comissaoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Comissoes', key: 'id' },
        onDelete: 'CASCADE',
      },
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'LodgeMembers', key: 'id' },
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'MembroComissoes',
      timestamps: false, // Tabela de junção não precisa de timestamps
    }
  );
  return MembroComissao;
};