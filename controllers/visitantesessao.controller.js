import db from "../models/index.js";

// Lista todos os registros de visitantes para uma sessão específica.
export const getAllVisitorsForSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const visitors = await db.VisitanteSessao.findAll({
      where: { masonicSessionId: sessionId },
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
 * Adiciona um registro de visita a uma sessão.
 * Esta função cria um novo 'snapshot' dos dados do visitante para a sessão atual,
 * preservando o histórico mesmo que os dados do visitante mudem no futuro.
 */
export const createVisitorInSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const sessionExists = await db.MasonicSession.findByPk(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // Os dados vêm do formulário (preenchidos manualmente ou automaticamente pela busca)
    const newVisitorRecord = await db.VisitanteSessao.create({
      ...req.body, // Contém nomeCompleto, graduacao, loja, etc.
      masonicSessionId: sessionId, // Associa o registro à sessão correta
    });

    res.status(201).json(newVisitorRecord);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao registrar visitante na sessão.",
      errorDetails: error.message,
    });
  }
};

// Atualiza um registro de visita específico (por exemplo, para corrigir um erro de digitação).
export const updateVisitorInSession = async (req, res) => {
  const { visitorId } = req.params; // ID do registro em VisitanteSessao
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
  const { visitorId } = req.params; // ID do registro em VisitanteSessao
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
