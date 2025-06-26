// backend/controllers/chanceler.controller.js
import db from "../models/index.js";
// Importa as funções corretas do serviço
import {
  getChancelerPanelData,
  gerarCartaoAniversarioPDF,
} from "../services/chanceler.service.js";

/**
 * Controller para buscar os dados para o Painel do Chanceler.
 * É chamado pela rota GET /api/chanceler/panel
 */
export const getPanelData = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    if (!dataInicio || !dataFim) {
      return res
        .status(400)
        .json({
          message: "Os parâmetros dataInicio e dataFim são obrigatórios.",
        });
    }

    // Chama a função correta do serviço
    const dados = await getChancelerPanelData(
      new Date(dataInicio),
      new Date(dataFim)
    );
    res.status(200).json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados para o Painel do Chanceler:", error);
    res
      .status(500)
      .json({
        message: "Erro interno ao processar a solicitação.",
        errorDetails: error.message,
      });
  }
};

/**
 * Controller para gerar um cartão de aniversário manualmente.
 * É chamado pela rota POST /api/chanceler/gerar-cartao
 */
export const gerarCartaoManual = async (req, res) => {
  const { memberId, familyMemberId } = req.body;
  try {
    let aniversariante;
    if (memberId) {
      const membro = await db.LodgeMember.findByPk(memberId, {
        attributes: ["NomeCompleto", "DataNascimento", "Situacao"],
      });
      if (!membro)
        return res.status(404).json({ message: "Membro não encontrado." });
      if (membro.Situacao !== "Ativo")
        return res
          .status(400)
          .json({
            message: `Não é possível gerar cartão para um membro com situação "${membro.Situacao}".`,
          });
      aniversariante = {
        nome: membro.NomeCompleto,
        dataNascimento: membro.DataNascimento,
      };
    } else if (familyMemberId) {
      const familiar = await db.FamilyMember.findByPk(familyMemberId, {
        attributes: ["nomeCompleto", "dataNascimento", "falecido"],
      });
      if (!familiar)
        return res.status(404).json({ message: "Familiar não encontrado." });
      if (familiar.falecido)
        return res
          .status(400)
          .json({
            message: "Não é possível gerar cartão para um familiar falecido.",
          });
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
