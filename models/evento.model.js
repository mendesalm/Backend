// models/evento.model.js
export default (sequelize, DataTypes) => {
  const Evento = sequelize.define(
    "Evento",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "titulo", // Mapeia a propriedade 'nome' para a coluna 'titulo' do banco
        validate: { notEmpty: { msg: "O nome do evento é obrigatório." } },
      },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      dataHoraInicio: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { isDate: true },
      },
      dataHoraFim: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: { isDate: true },
      },
      local: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      tipo: {
        type: DataTypes.ENUM(
          "Sessão Maçônica",
          "Evento Social",
          "Evento Filantrópico",
          "Outro"
        ),
        allowNull: false,
      },
      criadoPorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "Eventos",
      timestamps: true,
    }
  );

  Evento.associate = function (models) {
    Evento.belongsTo(models.LodgeMember, {
      as: "criador",
      foreignKey: { name: "criadoPorId", allowNull: true },
      onDelete: "SET NULL",
    });
    Evento.belongsToMany(models.LodgeMember, {
      through: models.ParticipanteEvento,
      as: "participantes",
      foreignKey: "eventoId",
      otherKey: "lodgeMemberId",
    });
    Evento.hasMany(models.FotoEvento, { as: "fotos", foreignKey: "eventoId" });
  };

  return Evento;
};
