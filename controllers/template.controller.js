// controllers/template.controller.js
import db from "../models/index.js";

// Lista todos os templates de mensagem existentes
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await db.MensagemTemplate.findAll({
      order: [["eventoGatilho", "ASC"]],
    });
    res.status(200).json(templates);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar templates.",
        errorDetails: error.message,
      });
  }
};

// Atualiza um template específico
export const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { assunto, corpo } = req.body;
  try {
    const template = await db.MensagemTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: "Template não encontrado." });
    }
    await template.update({ assunto, corpo });
    res.status(200).json(template);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao atualizar template.",
        errorDetails: error.message,
      });
  }
};

// Endpoint CRUCIAL: Informa ao frontend quais placeholders podem ser usados em cada template
export const getAvailablePlaceholders = (req, res) => {
  const placeholders = {
    ANIVERSARIO_MEMBRO: [
      {
        placeholder: "{{NomeCompleto}}",
        description: "Nome completo do membro aniversariante.",
      },
      { placeholder: "{{Email}}", description: "Email do membro." },
    ],
    ANIVERSARIO_FAMILIAR: [
      {
        placeholder: "{{NomeCompleto}}",
        description: "Nome do membro que está sendo notificado.",
      },
      {
        placeholder: "{{familiar.nomeCompleto}}",
        description: "Nome do familiar aniversariante.",
      },
      {
        placeholder: "{{familiar.parentesco}}",
        description: "Parentesco do familiar (ex: Filho, Esposa).",
      },
    ],
    ANIVERSARIO_MACONICO: [
      { placeholder: "{{NomeCompleto}}", description: "Nome do membro." },
      {
        placeholder: "{{tipoAniversario}}",
        description: "Tipo de data comemorada (Iniciação, Elevação, etc.).",
      },
      {
        placeholder: "{{anos}}",
        description: "Quantidade de anos comemorados.",
      },
    ],
    CADASTRO_APROVADO: [
      { placeholder: "{{NomeCompleto}}", description: "Nome do novo membro." },
    ],
    AVISO_AUSENCIA_CONSECUTIVA: [
      {
        placeholder: "{{NomeCompleto}}",
        description: "Nome do membro ausente.",
      },
    ],
    CONVOCACAO_SESSAO_COLETIVA: [
      {
        placeholder: "{{sessao.data}}",
        description: "Data da sessão por extenso.",
      },
      {
        placeholder: "{{sessao.tipoSessao}}",
        description: "Tipo da sessão (ex: Ordinária).",
      },
      {
        placeholder: "{{sessao.subtipoSessao}}",
        description: "Grau da sessão (ex: Aprendiz).",
      },
    ],
  };
  res.status(200).json(placeholders);
};
