import db from "../models/index.js";
import {
  swapResponsabilidadeJantarOrder,
  reorderResponsabilidadesJantar,
} from "../services/escala.service.js";

export const swapResponsabilidadeJantarOrderController = async (req, res) => {
  const { id1, id2 } = req.body;

  if (!id1 || !id2) {
    return res
      .status(400)
      .json({ message: "IDs de responsabilidade de jantar são obrigatórios." });
  }

  const transaction = await db.sequelize.transaction();
  try {
    await swapResponsabilidadeJantarOrder(id1, id2, transaction);
    await transaction.commit();
    res
      .status(200)
      .json({
        message: "Ordem das responsabilidades de jantar trocada com sucesso.",
      });
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Erro ao trocar ordem das responsabilidades de jantar:",
      error
    );
    res.status(500).json({
      message: "Erro ao trocar ordem das responsabilidades de jantar.",
      errorDetails: error.message,
    });
  }
};

export const reorderResponsabilidadesJantarController = async (req, res) => {
  const { orderedIds } = req.body;

  if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res
      .status(400)
      .json({
        message: "A lista de IDs ordenada é obrigatória e não pode ser vazia.",
      });
  }

  const transaction = await db.sequelize.transaction();
  try {
    await reorderResponsabilidadesJantar(orderedIds, transaction);
    await transaction.commit();
    res
      .status(200)
      .json({
        message:
          "Ordem das responsabilidades de jantar atualizada com sucesso.",
      });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao reordenar responsabilidades de jantar:", error);
    res.status(500).json({
      message: "Erro ao reordenar responsabilidades de jantar.",
      errorDetails: error.message,
    });
  }
};
