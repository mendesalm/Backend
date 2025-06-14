// controllers/visitacao.controller.js
import db from "../models/index.js";

// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Criar um novo registro de visita
export const createVisita = async (req, res) => {
  try {
    const visita = await db.Visita.create(req.body); // Usa db.Visita
    res.status(201).json(visita);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({
        message: "Erro ao registrar visita.",
        errorDetails: error.message,
      });
  }
};

// Listar todas as visitas, com filtros
export const getAllVisitas = async (req, res) => {
  try {
    const { lojaVisitada, lodgeMemberId } = req.query;
    const whereClause = {};
    if (lojaVisitada)
      whereClause.lojaVisitada = {
        [db.Sequelize.Op.like]: `%${lojaVisitada}%`,
      };
    if (lodgeMemberId) whereClause.lodgeMemberId = lodgeMemberId;

    const visitas = await db.Visita.findAll({
      // Usa db.Visita
      where: whereClause,
      include: [
        {
          model: db.LodgeMember,
          as: "visitante",
          attributes: ["id", "NomeCompleto"],
        },
      ], // Usa db.LodgeMember
      order: [["dataSessao", "DESC"]],
    });
    res.status(200).json(visitas);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar visitas.",
        errorDetails: error.message,
      });
  }
};

// Obter uma visita por ID
export const getVisitaById = async (req, res) => {
  try {
    const visita = await db.Visita.findByPk(req.params.id, {
      // Usa db.Visita
      include: [
        {
          model: db.LodgeMember,
          as: "visitante",
          attributes: ["id", "NomeCompleto"],
        },
      ], // Usa db.LodgeMember
    });
    if (!visita) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    res.status(200).json(visita);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar registro de visita.",
        errorDetails: error.message,
      });
  }
};

// Atualizar uma visita
export const updateVisita = async (req, res) => {
  try {
    const [updated] = await db.Visita.update(req.body, {
      where: { id: req.params.id },
    }); // Usa db.Visita
    if (!updated) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    const updatedVisita = await db.Visita.findByPk(req.params.id); // Usa db.Visita
    res.status(200).json(updatedVisita);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({
        message: "Erro ao atualizar registro de visita.",
        errorDetails: error.message,
      });
  }
};

// Deletar uma visita
export const deleteVisita = async (req, res) => {
  try {
    const deleted = await db.Visita.destroy({ where: { id: req.params.id } }); // Usa db.Visita
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao deletar registro de visita.",
        errorDetails: error.message,
      });
  }
};
