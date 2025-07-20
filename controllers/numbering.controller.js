import { setCounterNumber } from "../services/numbering.service.js";
import db from "../models/index.js";

export const setNumber = async (req, res) => {
  const { counterName, newNumber } = req.body;

  if (!counterName || !newNumber || isNaN(parseInt(newNumber))) {
    return res.status(400).json({ message: "Nome do contador e novo número são obrigatórios e o número deve ser válido." });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const updatedValue = await setCounterNumber(counterName, parseInt(newNumber), transaction);
    await transaction.commit();
    res.status(200).json({ message: `Contador '${counterName}' definido para ${updatedValue}.` });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao definir o número do contador:", error);
    res.status(500).json({ message: "Erro interno ao definir o número do contador.", errorDetails: error.message });
  }
};