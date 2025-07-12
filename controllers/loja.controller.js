// controllers/loja.controller.js
import db from "../models/index.js";

/**
 * Procura na nova tabela 'Lojas' para a funcionalidade de autocompletar.
 * Retorna uma lista de objetos de Loja.
 */
export const searchLojasVisitadas = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      message: "O termo de busca deve ter no mínimo 2 caracteres.",
    });
  }

  try {
    const { Op } = db.Sequelize;
    const lojas = await db.Loja.findAll({
      where: {
        nome: {
          [Op.like]: `%${q}%`,
        },
      },
      limit: 10,
    });

    res.status(200).json(lojas);
  } catch (error) {
    console.error("Erro ao buscar lojas para autocompletar:", error);
    res.status(500).json({
      message: "Erro no servidor ao buscar lojas.",
      errorDetails: error.message,
    });
  }
};

// Criar uma nova Loja
export const createLoja = async (req, res) => {
  try {
    const loja = await db.Loja.create(req.body);
    res.status(201).json(loja);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao criar loja.", errorDetails: error.message });
  }
};

// Obter todas as Lojas
export const getAllLojas = async (req, res) => {
  try {
    const lojas = await db.Loja.findAll({ order: [["nome", "ASC"]] });
    res.status(200).json(lojas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar lojas.", errorDetails: error.message });
  }
};

// Obter uma Loja por ID
export const getLojaById = async (req, res) => {
  try {
    const loja = await db.Loja.findByPk(req.params.id);
    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    res.status(200).json(loja);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar loja.", errorDetails: error.message });
  }
};

// Atualizar uma Loja
export const updateLoja = async (req, res) => {
  try {
    const [updated] = await db.Loja.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    const updatedLoja = await db.Loja.findByPk(req.params.id);
    res.status(200).json(updatedLoja);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar loja.",
      errorDetails: error.message,
    });
  }
};

// Apagar uma Loja
export const deleteLoja = async (req, res) => {
  try {
    const deleted = await db.Loja.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao apagar loja.", errorDetails: error.message });
  }
};
