// backend/models/cargoexercido.model.js
export default (sequelize, DataTypes) => {
  const CargoExercido = sequelize.define('CargoExercido', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nomeCargo: {
      type: DataTypes.ENUM(
        "Venerável Mestre", "Primeiro Vigilante", "Segundo Vigilante", "Orador", "Orador Adjunto",
        "Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Tesoureiro", "Tesoureiro Adjunto",
        "Mestre de Cerimônias", "Mestre de Harmonia", "Mestre de Harmonia Adjunto", 
        "Arquiteto", "Arquiteto Adjunto", "Bibliotecário", "Bibliotecário Adjunto",
        "Primeiro Diácono", "Segundo Diácono", "Primeiro Experto", "Segundo Experto", 
        "Cobridor Interno", "Cobridor Externo", "Hospitaleiro", "Porta Bandeira", 
        "Porta Estandarte", "Deputado Estadual", "Deputado Federal", "Sem cargo definido"
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: "O nome do cargo é obrigatório." }
      }
    },
    dataInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: "A data de início do cargo é obrigatória." },
        isDate: { msg: "A data de início deve ser uma data válida."}
      }
    },
    dataTermino: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Um cargo pode estar ativo
      validate: {
        isDate: { msg: "A data de término deve ser uma data válida, se fornecida."}
      }
    },
    // lodgeMemberId é uma chave estrangeira definida na associação
  }, {
    timestamps: true,
    tableName: 'CargosExercidos',
  });

  CargoExercido.associate = function(models) {
    if (models.LodgeMember) {
      CargoExercido.belongsTo(models.LodgeMember, {
        foreignKey: {
          name: 'lodgeMemberId',
          allowNull: false,
        },
        onDelete: 'CASCADE',
      });
    } else {
      console.error("MODELO AUSENTE: LodgeMember não pôde ser associado em CargoExercido.");
    }
  };

  return CargoExercido;
};