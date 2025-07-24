import db from "../models/index.js";

/**
 * Re-atribui a ordem alfabética para todos os membros ativos na escala.
 * Usado no início de um novo ciclo.
 * @param {object} transaction - A transação do Sequelize.
 */
const reassignOrdemAlphabetically = async (transaction) => {
  const membrosAtivos = await db.ResponsabilidadeJantar.findAll({
    where: { status: "Ativo" },
    include: [{ model: db.LodgeMember, as: "membro", attributes: ["NomeCompleto"] }],
    order: [[{ model: db.LodgeMember, as: "membro" }, "NomeCompleto", "ASC"]],
    transaction,
  });

  for (let i = 0; i < membrosAtivos.length; i++) {
    await membrosAtivos[i].update({ ordem: i + 1 }, { transaction });
  }
};

/**
 * --- LÓGICA DE AVANÇO CIRCULAR AUTOMÁTICA ---
 * Avança a escala, move o responsável para o final da fila e retorna os dados
 * do membro e o ID do registro da escala para vinculação.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<object|null>} Objeto com { membroResponsavel, responsabilidadeJantarId } ou null.
 */
export const avancarEscalaSequencialEObterResponsavel = async (transaction) => {
  // 1. Tenta encontrar o próximo disponível no ciclo atual (menor 'ordem' e ainda não foi responsável)
  let proximoNaEscala = await db.ResponsabilidadeJantar.findOne({
    where: { status: "Ativo", foiResponsavelNoCiclo: false },
    order: [["ordem", "ASC"]],
    transaction,
  });

  // 2. Se não há mais ninguém disponível, um novo ciclo começa
  if (!proximoNaEscala) {
    console.log("Fim do ciclo. Reiniciando a escala e reatribuindo ordem alfabética.");
    // Marca todos como disponíveis novamente
    await db.ResponsabilidadeJantar.update(
      { foiResponsavelNoCiclo: false },
      { where: { status: "Ativo" }, transaction }
    );

    // Reatribui a ordem alfabeticamente para o novo ciclo
    await reassignOrdemAlphabetically(transaction);

    // Busca novamente o primeiro da lista (agora reiniciada e reordenada)
    proximoNaEscala = await db.ResponsabilidadeJantar.findOne({
      where: { status: "Ativo", foiResponsavelNoCiclo: false },
      order: [["ordem", "ASC"]],
      transaction,
    });
  }

  if (!proximoNaEscala) {
    console.log("Nenhum membro ativo encontrado para iniciar a escala.");
    return null;
  }

  // 3. Marca o membro selecionado como "já foi" no ciclo atual
  // (Esta ação só será commitada junto com a criação da sessão)
  await proximoNaEscala.update({ foiResponsavelNoCiclo: true }, { transaction });

  // Retorna os dados para a criação da sessão
  const membroResponsavel = await db.LodgeMember.findByPk(proximoNaEscala.lodgeMemberId, { transaction });
  return { membroResponsavel, responsabilidadeJantarId: proximoNaEscala.id };
};

/**
 * Troca a ordem de dois membros na escala de jantar.
 * @param {number} id1 - ID da primeira ResponsabilidadeJantar.
 * @param {number} id2 - ID da segunda ResponsabilidadeJantar.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<void>}
 */
export const swapResponsabilidadeJantarOrder = async (id1, id2, transaction) => {
  const resp1 = await db.ResponsabilidadeJantar.findByPk(id1, { transaction });
  const resp2 = await db.ResponsabilidadeJantar.findByPk(id2, { transaction });

  if (!resp1 || !resp2) {
    throw new Error("Uma ou ambas as responsabilidades de jantar não foram encontradas.");
  }

  // Troca os valores de 'ordem'
  const tempOrdem = resp1.ordem;
  await resp1.update({ ordem: resp2.ordem }, { transaction });
  await resp2.update({ ordem: tempOrdem }, { transaction });
};

/**
 * Reordena as responsabilidades de jantar com base em uma lista ordenada de IDs.
 * @param {Array<number>} orderedIds - Uma lista ordenada de IDs de ResponsabilidadeJantar.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<void>}
 */
export const reorderResponsabilidadesJantar = async (orderedIds, transaction) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("A lista de IDs ordenada não pode ser vazia.");
  }

  // Fetch all relevant responsibilities in one go to minimize database hits
  const responsibilities = await db.ResponsabilidadeJantar.findAll({
    where: {
      id: orderedIds,
    },
    transaction,
  });

  // Create a map for quick lookup
  const responsibilityMap = new Map(responsibilities.map(r => [r.id, r]));

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const newOrder = i + 1; // Ordem é 1-baseada

    const responsibility = responsibilityMap.get(id);
    if (!responsibility) {
      throw new Error(`Responsabilidade de jantar com ID ${id} não encontrada.`);
    }

    if (responsibility.ordem !== newOrder) {
      await responsibility.update({ ordem: newOrder }, { transaction });
    }
  }
};

/**
 * Inicializa a escala pela primeira vez, adicionando todos os membros ativos
 * em ordem alfabética e atribuindo a ordem inicial.
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
        status: "Ativo",
        ordem: index + 1, // Atribui a ordem inicial aqui
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
