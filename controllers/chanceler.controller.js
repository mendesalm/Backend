import db from "../models/index.js";
import { gerarCartaoAniversarioPDF } from "../services/chanceler.service.js";

// ... (outras funções do controller)

export const gerarCartaoManual = async (req, res) => {
  const { memberId, familyMemberId } = req.body;
  try {
    let aniversariante;
    if (memberId) {
      const membro = await db.LodgeMember.findByPk(memberId, {
        attributes: ["NomeCompleto", "DataNascimento"],
      });
      if (!membro)
        return res.status(404).json({ message: "Membro não encontrado." });
      aniversariante = {
        nome: membro.NomeCompleto,
        dataNascimento: membro.DataNascimento,
      };
    } else if (familyMemberId) {
      const familiar = await db.FamilyMember.findByPk(familyMemberId, {
        attributes: ["nomeCompleto", "dataNascimento"],
      });
      if (!familiar)
        return res.status(404).json({ message: "Familiar não encontrado." });
      aniversariante = {
        nome: familiar.nomeCompleto,
        dataNascimento: familiar.dataNascimento,
      };
    } else {
      return res
        .status(400)
        .json({
          message: "É necessário fornecer o ID do membro ou do familiar.",
        });
    }

    // Só gera para quem não é falecido
    // (Adicionar a lógica de verificação de status aqui se necessário)

    const caminhoPDF = await gerarCartaoAniversarioPDF(aniversariante);
    res
      .status(200)
      .json({ message: "Cartão gerado com sucesso!", caminho: caminhoPDF });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao gerar cartão manual.",
        errorDetails: error.message,
      });
  }
};
