import db from "../models/index.js";
const { Op } = db.Sequelize;

/**
 * Função auxiliar para verificar se uma data (ignorando o ano) está dentro de um intervalo.
 */
const isDateInRange = (date, startDate, endDate) => {
  if (!date) return false;
  const checkDate = new Date(date);
  const startYear = startDate.getFullYear();

  checkDate.setFullYear(startYear);
  if (checkDate < startDate) {
    checkDate.setFullYear(startYear + 1);
  }

  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Busca aniversariantes (nascimento, casamento, maçônico) em um período.
 */
async function findAnniversaries(dataInicio, dataFim) {
  const allMembers = await db.LodgeMember.findAll({
    where: { Situacao: "Ativo" },
    attributes: [
      "id",
      "NomeCompleto",
      "DataNascimento",
      "DataCasamento",
      "DataIniciacao",
      "DataElevacao",
      "DataExaltacao",
    ],
  });

  const allFamily = await db.FamilyMember.findAll({
    include: [
      {
        model: db.LodgeMember,
        as: "membro",
        attributes: ["NomeCompleto"],
        required: true,
      },
    ],
  });

  const aniversariantes = {
    nascimentos: { membros: [], familiares: [] },
    casamentos: [],
    maconicos: [],
  };

  // Lógica para processar e agrupar os aniversariantes...
  allMembers.forEach((membro) => {
    if (isDateInRange(membro.DataNascimento, dataInicio, dataFim)) {
      aniversariantes.nascimentos.membros.push({
        id: membro.id,
        nome: membro.NomeCompleto,
        data: membro.DataNascimento,
      });
    }
    if (isDateInRange(membro.DataCasamento, dataInicio, dataFim)) {
      aniversariantes.casamentos.push({
        id: membro.id,
        nome: membro.NomeCompleto,
        data: membro.DataCasamento,
      });
    }
    const anivMaconicos = [];
    if (isDateInRange(membro.DataIniciacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Iniciação", data: membro.DataIniciacao });
    if (isDateInRange(membro.DataElevacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Elevação", data: membro.DataElevacao });
    if (isDateInRange(membro.DataExaltacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Exaltação", data: membro.DataExaltacao });

    if (anivMaconicos.length > 0) {
      aniversariantes.maconicos.push({
        id: membro.id,
        nome: membro.NomeCompleto,
        aniversarios: anivMaconicos,
      });
    }
  });

  allFamily.forEach((familiar) => {
    if (isDateInRange(familiar.dataNascimento, dataInicio, dataFim)) {
      aniversariantes.nascimentos.familiares.push({
        id: familiar.id,
        nome: familiar.nomeCompleto,
        data: familiar.dataNascimento,
        parentesco: familiar.parentesco,
        membroParente: familiar.membro.NomeCompleto,
      });
    }
  });

  return aniversariantes;
}

/**
 * --- FUNÇÃO CORRIGIDA ---
 * Busca o responsável pelo jantar da SESSÃO ATUAL e seu cônjuge.
 * @param {object} session - O objeto da sessão maçônica.
 */
async function findCurrentSessionResponsible(session) {
  // 1. Verifica se a sessão tem um responsável designado
  if (!session.responsavelJantarLodgeMemberId) {
    return { responsavelNome: "Institucional / A definir", conjugeNome: "N/A" };
  }

  // 2. Busca os dados do membro responsável que já está na sessão
  const responsavel = await db.LodgeMember.findByPk(
    session.responsavelJantarLodgeMemberId
  );

  if (!responsavel) {
    return {
      responsavelNome: "Responsável não encontrado",
      conjugeNome: "N/A",
    };
  }

  // 3. Busca o cônjuge do responsável encontrado
  const conjuge = await db.FamilyMember.findOne({
    where: {
      lodgeMemberId: responsavel.id,
      parentesco: { [Op.in]: ["Cônjuge", "Esposa"] },
    },
  });

  return {
    responsavelNome: responsavel.NomeCompleto,
    conjugeNome: conjuge ? conjuge.nomeCompleto : "Não informado",
  };
}

/**
 * Função principal que busca todos os dados para o painel do Chanceler.
 */
export const getPanelData = async (sessionId, dataFimStr) => {
  const session = await db.MasonicSession.findByPk(sessionId);
  if (!session) {
    throw new Error("Sessão não encontrada");
  }

  const dataInicio = new Date(session.dataSessao);
  const dataFim = new Date(dataFimStr);
  dataFim.setHours(23, 59, 59, 999);

  // --- CORREÇÃO APLICADA AQUI ---
  // A função agora chama a nova lógica 'findCurrentSessionResponsible'
  const [jantar, aniversariantes] = await Promise.all([
    findCurrentSessionResponsible(session),
    findAnniversaries(dataInicio, dataFim),
  ]);

  return {
    jantar, // 'jantar' agora contém os dados do responsável da SESSÃO ATUAL
    aniversariantes: {
      membros: aniversariantes.nascimentos.membros,
      familiares: aniversariantes.nascimentos.familiares,
      casamentos: aniversariantes.casamentos,
      maconicos: aniversariantes.maconicos,
    },
  };
};
