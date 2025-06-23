import db from "../models/index.js";

/**
 * --- LÓGICA DE AVANÇO REATORADA E OBJETIVA ---
 * Avança a escala sequencial, encontra o próximo membro 'Ativo' na ordem,
 * atualiza seu status para 'Cumprido', move-o para o final da fila, e retorna
 * seus dados completos (incluindo o cônjuge).
 * @param {object} transaction - A transação do Sequelize para garantir a atomicidade.
 * @returns {Promise<object|null>} O objeto do membro responsável, ou null se a escala estiver vazia.
 */
export const avancarEscalaSequencialEObterResponsavel = async (transaction) => {
  try {
    const { ResponsabilidadeJantar, LodgeMember, FamilyMember, sequelize } = db;

    // 1. Encontra o próximo da fila
    let proximoNaEscala = await ResponsabilidadeJantar.findOne({
      where: { status: "Ativo", sessaoDesignadaId: null },
      order: [["ordem", "ASC"]],
      transaction,
    });

    // Se ninguém for encontrado, é o fim do ciclo. Tente reiniciar.
    if (!proximoNaEscala) {
      console.log("Fim do ciclo da escala. Tentando reiniciar...");

      // Reseta todos os membros "Cumprido" de volta para "Ativo"
      await ResponsabilidadeJantar.update(
        { status: "Ativo" },
        {
          where: {
            status: "Cumprido",
            sessaoDesignadaId: null, // Apenas reinicia os da escala sequencial
          },
          transaction,
        }
      );

      console.log(
        "Escala reiniciada. Buscando o próximo responsável novamente."
      );

      // Tenta encontrar o próximo da fila novamente após o reset
      proximoNaEscala = await ResponsabilidadeJantar.findOne({
        where: { status: "Ativo", sessaoDesignadaId: null },
        order: [["ordem", "ASC"]],
        transaction,
      });

      // Se ainda assim não encontrar ninguém, a escala está realmente vazia.
      if (!proximoNaEscala) {
        console.log("A escala está vazia. Nenhum responsável para designar.");
        return null;
      }
    }

    // Guarda o ID do responsável antes de qualquer alteração
    const responsavelId = proximoNaEscala.lodgeMemberId;

    // 2. Encontra a ordem mais alta na escala
    const maxOrdemResult = await ResponsabilidadeJantar.findOne({
      attributes: [[sequelize.fn("max", sequelize.col("ordem")), "maxOrdem"]],
      where: { sessaoDesignadaId: null },
      raw: true,
      transaction,
    });
    const novaOrdem = (maxOrdemResult.maxOrdem || 0) + 1;

    // 3. --- CORREÇÃO OBJETIVA ---
    // Em vez de alterar o objeto e salvar, fazemos um UPDATE direto no banco
    // usando o ID do registro da escala. Isso garante a alteração do status.
    await ResponsabilidadeJantar.update(
      {
        ordem: novaOrdem,
        status: "Cumprido",
      },
      {
        where: { id: proximoNaEscala.id },
        transaction,
      }
    );

    console.log(
      `Registro da escala ID ${proximoNaEscala.id} movido para a ordem ${novaOrdem} com status 'Cumprido'.`
    );

    // 4. Busca os dados completos do membro para retornar
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

    if (membroResponsavel) {
      console.log(
        `Escala avançada. Responsável da sessão atual: ${membroResponsavel.NomeCompleto}`
      );
    }

    return membroResponsavel;
  } catch (error) {
    console.error("Erro no serviço ao avançar a escala de jantares:", error);
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
