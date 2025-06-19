import db from "../models/index.js";

export const createPatrimonio = async (req, res) => {
  // ... (código existente)
};

/**
 * REVERTIDO: Retorna um array simples de patrimônios, sem paginação.
 * Mantém a funcionalidade de busca por nome e filtro por estado.
 */
export const getAllPatrimonios = async (req, res) => {
  const { nome, estado } = req.query;
  const { Op } = db.Sequelize;
  const whereClause = {};
  if (nome) whereClause.nome = { [Op.like]: `%${nome}%` };
  if (estado) whereClause.estadoConservacao = estado;

  try {
    const itens = await db.Patrimonio.findAll({
      where: whereClause,
      include: [
        {
          model: db.LodgeMember,
          as: "registradoPor",
          attributes: ["NomeCompleto"],
        },
      ],
      order: [["nome", "ASC"]],
    });
    res.status(200).json(itens);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar patrimônio.",
      errorDetails: error.message,
    });
  }
};

// ... (resto do arquivo sem alterações)
export const getPatrimonioById = async (req, res) => {
  try {
    const item = await db.Patrimonio.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: "registradoPor",
          attributes: ["NomeCompleto"],
        },
      ],
    });
    if (!item)
      return res
        .status(404)
        .json({ message: "Item de patrimônio não encontrado." });
    res.status(200).json(item);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar item de patrimônio.",
        errorDetails: error.message,
      });
  }
};
export const updatePatrimonio = async (req, res) => {
  try {
    const [updated] = await db.Patrimonio.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res
        .status(404)
        .json({ message: "Item de patrimônio não encontrado." });
    const updatedItem = await db.Patrimonio.findByPk(req.params.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao atualizar item de patrimônio.",
        errorDetails: error.message,
      });
  }
};
export const deletePatrimonio = async (req, res) => {
  try {
    const deleted = await db.Patrimonio.destroy({
      where: { id: req.params.id },
    });
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Item de patrimônio não encontrado." });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao deletar item de patrimônio.",
        errorDetails: error.message,
      });
  }
};
