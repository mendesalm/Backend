// models/visitacao.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Visita = sequelize.define(
    "Visita",
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
      dataEntrega: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      lodgeMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "LodgeMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // --- CAMPO ADICIONADO ---
      lojaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lojas",
          key: "id",
        },
      },
      // --- CAMPOS ANTIGOS (REMOVIDOS DO MODELO, MAS AINDA NA TABELA) ---
      // lojaVisitada: DataTypes.STRING,
      // orienteLojaVisitada: DataTypes.STRING,
      // potenciaLojaVisitada: DataTypes.STRING,
    },
    {
      tableName: "Visitas",
      timestamps: true,
    }
  );

  Visita.associate = (models) => {
    // Associação com o membro que fez a visita
    Visita.belongsTo(models.LodgeMember, {
      foreignKey: "lodgeMemberId",
      as: "visitante",
    });

    // --- NOVA ASSOCIAÇÃO ---
    // Associação com a loja que foi visitada
    Visita.belongsTo(models.Loja, {
      foreignKey: "lojaId",
      as: "loja",
    });
  };

  return Visita;
};
