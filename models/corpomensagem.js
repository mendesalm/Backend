import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class CorpoMensagem extends Model {
    static associate(models) {
      // define association here
    }
  }
  CorpoMensagem.init({
    tipo: {
      type: DataTypes.ENUM('ANIVERSARIO', 'DIA_DOS_PAIS', 'EVENTO_ESPECIAL'),
      allowNull: false
    },
    subtipo: {
      type: DataTypes.ENUM('IRMAO', 'FAMILIAR', 'CUNHADA', 'SOBRINHO', 'EXTERNO'),
      allowNull: false
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CorpoMensagem',
    tableName: 'CorposMensagens'
  });
  return CorpoMensagem;
};