// models/mensagem_template.model.js
export default (sequelize, DataTypes) => {
  const MensagemTemplate = sequelize.define("MensagemTemplate", {
    // ... id ...
    eventoGatilho: {
      type: Sequelize.ENUM(
        "ANIVERSARIO_MEMBRO",
        "ANIVERSARIO_FAMILIAR",
        "ANIVERSARIO_MACONICO", // NOVO
        "CADASTRO_APROVADO", // NOVO
        "AVISO_AUSENCIA_CONSECUTIVA",
        "CONVOCACAO_SESSAO_COLETIVA" // NOVO
      ),
      allowNull: false,
      unique: true,
    },
    // ... outros campos (canal, assunto, corpo, etc.) ...
  });
  return MensagemTemplate;
};
