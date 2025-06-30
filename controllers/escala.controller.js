import db from "../models/index.js";
const { sequelize } = db;
const { fn, col } = sequelize;
console.log("VERIFICANDO MODELO NO CARREGAMENTO DO ARQUIVO:", {
  ResponsabilidadeJantar: !!db.ResponsabilidadeJantar, // '!!' converte para true/false
  LodgeMember: !!db.LodgeMember,
});
/**
 * GET /api/escala
 * Lista a escala sequencial de jantares, ordenada pela 'ordem'.
 */
export const getEscala = async (req, res) => {
  try {
    const escala = await db.ResponsabilidadeJantar.findAll({
      where: { sessaoDesignadaId: null },
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["id", "NomeCompleto"],
        },
      ],
      order: [["ordem", "ASC"]],
    });
    res.status(200).json(escala);
  } catch (error) {
    console.error("Erro ao buscar escala de jantares:", error);
    res.status(500).json({
      message: "Erro ao buscar escala de jantares.",
      errorDetails: error.message,
    });
  }
};

/**
 * GET /api/escala/proximo-responsavel
 * Retorna o próximo membro ativo na escala.
 */
export const getProximoResponsavel = async (req, res) => {
  try {
    // CORREÇÃO: A busca agora filtra explicitamente por status: 'Ativo'
    const proximo = await db.ResponsabilidadeJantar.findOne({
      where: {
        status: "Ativo",
        sessaoDesignadaId: null,
      },
      order: [["ordem", "ASC"]],
      include: [{ model: db.LodgeMember, as: "membro" }],
    });

    if (!proximo) {
      return res.status(404).json({
        message:
          "Nenhum responsável ativo encontrado na escala. Verifique se existem membros na escala com o status 'Ativo'.",
      });
    }
    res.status(200).json(proximo);
  } catch (error) {
    console.error("Erro ao buscar próximo responsável:", error);
    res.status(500).json({
      message: "Erro ao buscar próximo responsável.",
      errorDetails: error.message,
    });
  }
};

/**
 * POST /api/escala/inicializar
 * Cria a escala inicial com todos os membros ativos em ordem alfabética.
 */
export const inicializarEscala = async (req, res) => {
  console.log("VERIFICANDO MODELO NO INÍCIO DA EXECUÇÃO:", {
    ResponsabilidadeJantar: !!db.ResponsabilidadeJantar,
  });
  const transaction = await sequelize.transaction();
  try {
    await db.ResponsabilidadeJantar.destroy({
      where: { sessaoDesignadaId: null },
      transaction,
    });

    const membros = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      order: [["NomeCompleto", "ASC"]],
      attributes: ["id"],
    });

    if (membros.length === 0) {
      await transaction.commit();
      return res
        .status(200)
        .json({ message: "Nenhum membro ativo para criar a escala." });
    }

    const escalaData = membros.map((membro, index) => ({
      // --- CORREÇÃO APLICADA ---
      lodgeMemberId: membro.id, // Padronizado para 'lodgeMemberId'
      ordem: index + 1,
      status: "Ativo",
    }));

    await db.ResponsabilidadeJantar.bulkCreate(escalaData, { transaction });

    await transaction.commit();
    res.status(201).json({
      message: `Escala inicializada com sucesso com ${membros.length} membros.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao inicializar escala de jantares:", error);
    res.status(500).json({
      message: "Erro interno ao inicializar escala de jantares.",
      errorDetails: error.message,
    });
  }
};

/**
 * PUT /api/escala/ordenar
 * Recebe um array de IDs na nova ordem e atualiza a escala.
 */
export const updateOrdemEscala = async (req, res) => {
  const { ordemIds } = req.body;
  if (!Array.isArray(ordemIds)) {
    return res.status(400).json({
      message:
        "Um array com os IDs dos registros da escala, na nova ordem, é obrigatório.",
    });
  }
  const transaction = await sequelize.transaction();
  try {
    const promises = ordemIds.map((id, index) =>
      db.ResponsabilidadeJantar.update(
        { ordem: index + 1 },
        { where: { id: id }, transaction }
      )
    );
    await Promise.all(promises);
    await transaction.commit();
    res
      .status(200)
      .json({ message: "Ordem da escala atualizada com sucesso." });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao reordenar a escala:", error);
    res.status(500).json({
      message: "Erro ao reordenar a escala.",
      errorDetails: error.message,
    });
  }
};

/**
 * POST /api/escala/adicionar
 * Adiciona manualmente um novo membro ao final da escala sequencial.
 */
export const adicionarMembroEscala = async (req, res) => {
  // --- CORREÇÃO APLICADA ---
  const { lodgeMemberId } = req.body;
  if (!lodgeMemberId)
    return res.status(400).json({ message: "ID do membro é obrigatório." });
  try {
    const maxOrdemResult = await db.ResponsabilidadeJantar.findOne({
      attributes: [[fn("max", col("ordem")), "maxOrdem"]],
      where: { sessaoDesignadaId: null },
      raw: true,
    });
    const novoMembro = await db.ResponsabilidadeJantar.create({
      lodgeMemberId: lodgeMemberId, // --- CORREÇÃO APLICADA ---
      ordem: (maxOrdemResult.maxOrdem || 0) + 1,
      status: "Ativo",
    });
    res.status(201).json(novoMembro);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao adicionar membro à escala.",
      errorDetails: error.message,
    });
  }
};

/**
 * PUT /api/escala/:escalaId/status
 * Atualiza o status de um membro na escala (Ativo/Pausado).
 */
export const updateStatusEscala = async (req, res) => {
  const { escalaId } = req.params;
  const { status } = req.body;
  if (!status || !["Ativo", "Pausado", "Cumprido"].includes(status)) {
    return res.status(400).json({
      message:
        "Status inválido. Valores permitidos: 'Ativo', 'Pausado', 'Cumprido'.",
    });
  }
  try {
    const [updated] = await db.ResponsabilidadeJantar.update(
      { status },
      { where: { id: escalaId } }
    );
    if (updated === 0) {
      return res
        .status(404)
        .json({ message: "Registro na escala não encontrado." });
    }
    const updatedEntry = await db.ResponsabilidadeJantar.findByPk(escalaId);
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Erro ao atualizar status na escala:", error);
    res.status(500).json({
      message: "Erro ao atualizar status na escala.",
      errorDetails: error.message,
    });
  }
};

/**
 * DELETE /api/escala/:escalaId
 * Remove um membro da escala de jantares.
 */
export const removerMembroEscala = async (req, res) => {
  const { escalaId } = req.params;
  try {
    const deletedCount = await db.ResponsabilidadeJantar.destroy({
      where: { id: escalaId },
    });
    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Registro na escala não encontrado para remoção." });
    }
    res.status(200).json({ message: "Membro removido da escala com sucesso." });
  } catch (error) {
    console.error("Erro ao remover membro da escala:", error);
    res.status(500).json({
      message: "Erro ao remover membro da escala.",
      errorDetails: error.message,
    });
  }
};
