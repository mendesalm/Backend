// backend/models/visitantesessao.model.js
export default (sequelize, DataTypes) => {
  const VisitanteSessao = sequelize.define('VisitanteSessao', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nomeCompleto: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "O nome completo do visitante é obrigatório." }
      }
    },
    graduacao: { // Grau do visitante
      type: DataTypes.STRING, // Usar STRING para flexibilidade com diferentes potências/ritos
      allowNull: true,        // Pode ser opcional ou preenchido conforme informado
    },
    cim: { // CIM (ou identificador equivalente) do visitante
      type: DataTypes.STRING,
      allowNull: true,
    },
    potencia: { // Potência Maçônica do visitante (ex: GOB, COMAB, GLESB)
      type: DataTypes.STRING,
      allowNull: true,
    },
    loja: { // Nome e/ou número da Loja de origem do visitante
      type: DataTypes.STRING,
      allowNull: true,
    },
    oriente: { // Cidade de origem da Loja do visitante
      type: DataTypes.STRING,
      allowNull: true,
    },
    // masonicSessionId será adicionado pela associação abaixo
  }, {
    timestamps: true,
    tableName: 'VisitantesSessao', // Nome explícito da tabela
  });

  VisitanteSessao.associate = function(models) {
    // Um VisitanteSessao pertence a uma MasonicSession
    if (models.MasonicSession) {
      VisitanteSessao.belongsTo(models.MasonicSession, {
        foreignKey: {
          name: 'masonicSessionId',
          allowNull: false,
        },
        onDelete: 'CASCADE', // Se a sessão for deletada, os registros de visitantes também são
      });
    } else {
      console.error("MODELO AUSENTE: MasonicSession não pôde ser associado em VisitanteSessao.");
    }
  };

  return VisitanteSessao;
};