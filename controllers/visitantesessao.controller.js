// controllers/visitantesessao.controller.js
import db from "../models/index.js";

// Lista todos os registros de visitantes para uma sessão específica.
export const getAllVisitorsForSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const visitors = await db.VisitanteSessao.findAll({
      where: { masonicSessionId: sessionId },
      include: [
        { model: db.Loja, as: "loja" }, // Inclui os dados da loja associada
      ],
      order: [["nomeCompleto", "ASC"]],
    });
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar visitantes da sessão.",
      errorDetails: error.message,
    });
  }
};

/**
 * Adiciona um registro de visita a uma sessão, utilizando a tabela centralizada de Lojas.
 */
export const createVisitorInSession = async (req, res) => {
  const { sessionId } = req.params;
  const { dadosLoja, ...dadosVisitante } = req.body;
  const t = await db.sequelize.transaction();

  try {
    const sessionExists = await db.MasonicSession.findByPk(sessionId, {
      transaction: t,
    });
    if (!sessionExists) {
      await t.rollback();
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    let lojaId = null;
    if (dadosLoja && dadosLoja.nome) {
      const [loja] = await db.Loja.findOrCreate({
        where: {
          nome: dadosLoja.nome,
          cidade: dadosLoja.cidade,
          estado: dadosLoja.estado,
        },
        defaults: dadosLoja,
        transaction: t,
      });
      lojaId = loja.id;
    }

    const newVisitorRecord = await db.VisitanteSessao.create(
      {
        ...dadosVisitante,
        masonicSessionId: sessionId,
        lojaId: lojaId,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(newVisitorRecord);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Erro ao registrar visitante na sessão.",
      errorDetails: error.message,
    });
  }
};

// Atualiza um registro de visita específico (por exemplo, para corrigir um erro de digitação).
export const updateVisitorInSession = async (req, res) => {
  const { visitorId } = req.params;
  try {
    const visitorRecord = await db.VisitanteSessao.findByPk(visitorId);
    if (!visitorRecord) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    await visitorRecord.update(req.body);
    res.status(200).json(visitorRecord);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar registro de visita.",
      errorDetails: error.message,
    });
  }
};

// Deleta um registro de visita de uma sessão.
export const deleteVisitorFromSession = async (req, res) => {
  const { visitorId } = req.params;
  try {
    const deleted = await db.VisitanteSessao.destroy({
      where: { id: visitorId },
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar registro de visita.",
      errorDetails: error.message,
    });
  }
};
