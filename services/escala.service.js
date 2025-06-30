import db from "../models/index.js";

/**
 * --- LÓGICA DE AVANÇO CIRCULAR AUTOMÁTICA ---
 * Avança a escala, move o responsável para o final da fila e retorna os dados
 * do membro e o ID do registro da escala para vinculação.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<object|null>} Objeto com { membroResponsavel, responsabilidadeJantarId } ou null.
 */
export const avancarEscalaSequencialEObterResponsavel = async (transaction) => {
  try {
    const { ResponsabilidadeJantar, LodgeMember, FamilyMember, sequelize } = db;

    const proximoNaEscala = await ResponsabilidadeJantar.findOne({
      where: { status: "Ativo", sessaoDesignadaId: null },
      order: [["ordem", "ASC"]],
      transaction,
    });

    if (!proximoNaEscala) {
      console.log("Nenhum membro ativo na escala para designar.");
      return null;
    }

    const responsavelId = proximoNaEscala.lodgeMemberId;
    const responsabilidadeJantarId = proximoNaEscala.id;

    const maxOrdemResult = await ResponsabilidadeJantar.findOne({
      attributes: [[sequelize.fn("max", sequelize.col("ordem")), "maxOrdem"]],
      where: { sessaoDesignadaId: null },
      raw: true,
      transaction,
    });
    const novaOrdem = (maxOrdemResult.maxOrdem || 0) + 1;

    await ResponsabilidadeJantar.update(
      { ordem: novaOrdem },
      { where: { id: responsabilidadeJantarId }, transaction }
    );

    const membroResponsavel = await LodgeMember.findByPk(responsavelId, {
      include: [
        {
          model: FamilyMember,
          as: "familiares",
          where: { parentesco: "Cônjuge" },
          required: false,
          attributes: ["nomeCompleto"],
        },
      ],
      transaction,
    });

    console.log(
      `Escala avançada para o membro: ${membroResponsavel.NomeCompleto}. ID da responsabilidade: ${responsabilidadeJantarId}`
    );

    // Retorna tanto os dados do membro quanto o ID do registro da escala modificado
    return { membroResponsavel, responsabilidadeJantarId };
  } catch (error) {
    console.error(
      "Erro no serviço ao avançar a escala de jantares (lógica circular):",
      error
    );
    throw error;
  }
};

/**
 * Inicializa a escala pela primeira vez, adicionando todos os membros ativos
 * em ordem alfabética.
 */
export const inicializarEscala = async () => {
  const transaction = await db.sequelize.transaction();
  try {
    await db.ResponsabilidadeJantar.destroy({
      where: { sessaoDesignadaId: null },
      transaction,
    });

    const membros = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      order: [["NomeCompleto", "ASC"]],
      transaction,
    });

    if (membros.length > 0) {
      const escalaData = membros.map((membro, index) => ({
        lodgeMemberId: membro.id,
        ordem: index + 1,
        status: "Ativo",
      }));
      await db.ResponsabilidadeJantar.bulkCreate(escalaData, { transaction });
    }

    await transaction.commit();
    return membros;
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao inicializar escala:", error);
    throw error;
  }
};
