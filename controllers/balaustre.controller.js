import db from "../models/index.js";
import {
  createBalaustreFromTemplate,
  deleteGoogleFile,
} from "../services/googleDocs.service.js";

// Função para buscar dados do balaústre, agora incluindo a contagem de presença
export const getBalaustreDetails = async (req, res) => {
  try {
    const balaustre = await db.Balaustre.findByPk(req.params.id);
    if (!balaustre) {
      return res.status(404).json({ message: "Balaústre não encontrado." });
    }

    // Realiza a contagem atual de presentes e visitantes
    const presentesCount = await db.SessionAttendee.count({
      where: { sessionId: balaustre.MasonicSessionId },
    });
    const visitantesCount = await db.VisitanteSessao.count({
      where: { masonicSessionId: balaustre.MasonicSessionId },
    });

    // Retorna os dados do formulário salvos e também as contagens mais recentes
    res.status(200).json({
      dadosFormulario: balaustre.dadosFormulario,
      presentesCount,
      visitantesCount,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do balaústre:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao buscar detalhes do balaústre.",
      });
  }
};

// Função para atualizar um balaústre existente (confia nos dados do formulário)
export const updateBalaustre = async (req, res) => {
  const { id } = req.params;
  const newData = req.body; // newData já inclui os números corrigidos pelo Secretário

  try {
    const balaustre = await db.Balaustre.findByPk(id);
    if (!balaustre) {
      return res
        .status(404)
        .json({ message: "Balaústre não encontrado para atualizar." });
    }

    // Deleta o arquivo antigo do Google Drive
    if (balaustre.googleDocId) {
      await deleteGoogleFile(balaustre.googleDocId);
    }

    // Cria um novo documento a partir do template com os novos dados (incluindo as contagens manuais)
    const { googleDocId, pdfPath } = await createBalaustreFromTemplate(
      newData,
      balaustre.MasonicSessionId
    );

    // Atualiza o registro no banco de dados com os novos IDs e dados
    balaustre.googleDocId = googleDocId;
    balaustre.caminhoPdfLocal = pdfPath;
    balaustre.dadosFormulario = newData; // Salva os dados corrigidos
    balaustre.numero = newData.NumeroBalaustre;

    const dateParts = newData.DiaSessao.split(" de ");
    if (dateParts.length === 3) {
      balaustre.ano = parseInt(dateParts[2], 10);
    }

    await balaustre.save();

    res
      .status(200)
      .json({
        message: "Balaústre atualizado e regenerado com sucesso!",
        balaustre,
      });
  } catch (error) {
    console.error("Erro ao atualizar o balaústre:", error.stack);
    res
      .status(500)
      .json({
        message: "Falha ao atualizar o balaústre.",
        errorDetails: error.message,
        stack: error.stack,
      });
  }
};

export const setNextBalaustreNumber = async (req, res) => {
  const { nextNumber } = req.body;

  if (!nextNumber || isNaN(parseInt(nextNumber)) || parseInt(nextNumber) <= 0) {
    return res.status(400).json({ message: "O número de início do balaústre deve ser um número inteiro positivo." });
  }

  try {
    await db.Configuracao.upsert({
      chave: 'nextBalaustreNumber',
      valor: String(parseInt(nextNumber)),
    });

    res.status(200).json({ message: `Próximo número de balaústre definido para ${nextNumber}.` });
  } catch (error) {
    console.error("Erro ao definir o próximo número de balaústre:", error);
    res.status(500).json({ message: "Erro interno do servidor ao definir o número de balaústre." });
  }
};
  const { id } = req.params;
  const newData = req.body; // newData já inclui os números corrigidos pelo Secretário

  try {
    const balaustre = await db.Balaustre.findByPk(id);
    if (!balaustre) {
      return res
        .status(404)
        .json({ message: "Balaústre não encontrado para atualizar." });
    }

    // Deleta o arquivo antigo do Google Drive
    if (balaustre.googleDocId) {
      await deleteGoogleFile(balaustre.googleDocId);
    }

    // Cria um novo documento a partir do template com os novos dados (incluindo as contagens manuais)
    const { googleDocId, pdfPath } = await createBalaustreFromTemplate(
      newData,
      balaustre.MasonicSessionId
    );

    // Atualiza o registro no banco de dados com os novos IDs e dados
    balaustre.googleDocId = googleDocId;
    balaustre.caminhoPdfLocal = pdfPath;
    balaustre.dadosFormulario = newData; // Salva os dados corrigidos
    balaustre.numero = newData.NumeroBalaustre;

    const dateParts = newData.DiaSessao.split(" de ");
    if (dateParts.length === 3) {
      balaustre.ano = parseInt(dateParts[2], 10);
    }

    await balaustre.save();

    res
      .status(200)
      .json({
        message: "Balaústre atualizado e regenerado com sucesso!",
        balaustre,
      });
  } catch (error) {
    console.error("Erro ao atualizar o balaústre:", error.stack);
    res
      .status(500)
      .json({
        message: "Falha ao atualizar o balaústre.",
        errorDetails: error.message,
        stack: error.stack,
      });
  }
};
