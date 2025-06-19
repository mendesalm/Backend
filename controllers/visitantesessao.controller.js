import db from "../models/index.js";

// GET /api/sessions/:sessionId/visitors
export const getAllVisitorsForSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const visitors = await db.VisitanteSessao.findAll({
      where: { masonicSessionId: sessionId },
      order: [["nomeCompleto", "ASC"]],
    });
    res.status(200).json(visitors);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar visitantes.",
        errorDetails: error.message,
      });
  }
};

// POST /api/sessions/:sessionId/visitors
export const createVisitor = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const sessionExists = await db.MasonicSession.findByPk(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
    const newVisitor = await db.VisitanteSessao.create({
      ...req.body,
      masonicSessionId: sessionId,
    });
    res.status(201).json(newVisitor);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao adicionar visitante.",
        errorDetails: error.message,
      });
  }
};

// PUT /api/sessions/:sessionId/visitors/:visitorId
export const updateVisitor = async (req, res) => {
  const { visitorId } = req.params;
  try {
    const visitor = await db.VisitanteSessao.findByPk(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: "Visitante não encontrado." });
    }
    await visitor.update(req.body);
    res.status(200).json(visitor);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao atualizar visitante.",
        errorDetails: error.message,
      });
  }
};

// DELETE /api/sessions/:sessionId/visitors/:visitorId
export const deleteVisitor = async (req, res) => {
  const { visitorId } = req.params;
  try {
    const deleted = await db.VisitanteSessao.destroy({
      where: { id: visitorId },
    });
    if (!deleted) {
      return res.status(404).json({ message: "Visitante não encontrado." });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao deletar visitante.",
        errorDetails: error.message,
      });
  }
};
