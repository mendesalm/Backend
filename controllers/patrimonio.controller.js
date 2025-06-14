// controllers/patrimonio.controller.js
import db from "../models/index.js";
// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Criar um novo item de patrimônio
export const createPatrimonio = async (req, res) => {
  const {
    nome,
    descricao,
    dataAquisicao,
    valorAquisicao,
    estadoConservacao,
    localizacao,
  } = req.body;
  const registradoPorId = req.user.id;
  try {
    // CORREÇÃO: Aceder ao modelo através de `db.Patrimonio`
    const novoItem = await db.Patrimonio.create({
      nome,
      descricao,
      dataAquisicao,
      valorAquisicao,
      estadoConservacao,
      localizacao,
      registradoPorId,
    });
    res.status(201).json(novoItem);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao criar item de patrimônio.",
        errorDetails: error.message,
      });
  }
};

// Listar todos os itens do patrimônio
export const getAllPatrimonios = async (req, res) => {
  const { nome, estado } = req.query;
  const { Op } = db.Sequelize; // Obter Op de forma segura
  const whereClause = {};
  if (nome) whereClause.nome = { [Op.like]: `%${nome}%` };
  if (estado) whereClause.estadoConservacao = estado;

  try {
    // CORREÇÃO: Aceder aos modelos através de `db.`
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
    res
      .status(500)
      .json({
        message: "Erro ao listar patrimônio.",
        errorDetails: error.message,
      });
  }
};

// Obter um item por ID
export const getPatrimonioById = async (req, res) => {
  try {
    // CORREÇÃO: Aceder aos modelos através de `db.`
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

// Atualizar um item
export const updatePatrimonio = async (req, res) => {
  try {
    // CORREÇÃO: Aceder ao modelo através de `db.Patrimonio`
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

// Deletar um item
export const deletePatrimonio = async (req, res) => {
  try {
    // CORREÇÃO: Aceder ao modelo através de `db.Patrimonio`
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
