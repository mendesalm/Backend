import db from "../models/index.js";
const { Op, literal } = db.Sequelize;

/**
 * Função auxiliar para verificar se uma data (ignorando o ano) está dentro de um intervalo.
 * @param {Date} date - A data a ser verificada (ex: data de nascimento).
 * @param {Date} startDate - A data de início do intervalo.
 * @param {Date} endDate - A data de fim do intervalo.
 * @returns {boolean}
 */
const isDateInRange = (date, startDate, endDate) => {
  if (!date) return false;
  const checkDate = new Date(date);

  // Normaliza o ano da data de aniversário para o ano da data de início para comparação
  checkDate.setFullYear(startDate.getFullYear());

  // Se a data já passou este ano, verifica contra o próximo ano
  if (checkDate < startDate) {
    checkDate.setFullYear(startDate.getFullYear() + 1);
  }

  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Busca aniversariantes (nascimento, casamento, maçônico) em um período.
 * @param {Date} dataInicio - Data de início da busca.
 * @param {Date} dataFim - Data de fim da busca.
 * @returns {Object} Objeto com listas de aniversariantes.
 */
async function findAnniversaries(dataInicio, dataFim) {
  const allMembers = await db.LodgeMember.findAll({
    where: { Situacao: "Ativo" },
    attributes: [
      "id",
      "NomeCompleto",
      "dataNascimento",
      "dataCasamento",
      "dataIniciacao",
      "dataElevacao",
      "dataExaltacao",
    ],
  });

  const allFamily = await db.FamilyMember.findAll({
    include: [
      { model: db.LodgeMember, attributes: ["NomeCompleto"], required: true },
    ],
  });

  const aniversariantes = {
    nascimentos: { membros: [], familiares: [] },
    casamentos: [],
    maconicos: [],
  };

  // Filtra aniversários em JavaScript para lidar corretamente com a lógica de datas
  allMembers.forEach((membro) => {
    // Nascimento do Membro
    if (isDateInRange(membro.dataNascimento, dataInicio, dataFim)) {
      aniversariantes.nascimentos.membros.push({
        id: membro.id,
        nome: membro.NomeCompleto,
        data: membro.dataNascimento,
      });
    }
    // Casamento
    if (isDateInRange(membro.dataCasamento, dataInicio, dataFim)) {
      aniversariantes.casamentos.push({
        id: membro.id,
        nome: membro.NomeCompleto,
        data: membro.dataCasamento,
      });
    }
    // Maçônicos
    const anivMaconicos = [];
    if (isDateInRange(membro.dataIniciacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Iniciação", data: membro.dataIniciacao });
    if (isDateInRange(membro.dataElevacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Elevação", data: membro.dataElevacao });
    if (isDateInRange(membro.dataExaltacao, dataInicio, dataFim))
      anivMaconicos.push({ tipo: "Exaltação", data: membro.dataExaltacao });

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
        membroParente: familiar.LodgeMember.NomeCompleto,
      });
    }
  });

  return aniversariantes;
}

/**
 * Busca o responsável pelo jantar da sessão e seu cônjuge.
 * A lógica foi ajustada para refletir como a escala funciona (ponteiro), não por sessionId.
 * @returns {Object} Objeto com os nomes do responsável e do cônjuge.
 */
async function findDinnerResponsible() {
  const ponteiroConfig = await db.Configuracao.findOne({
    where: { chave: "escala_jantar_ponteiro" },
  });
  const proximaOrdem = ponteiroConfig ? parseInt(ponteiroConfig.valor, 10) : 1;

  const proximoNaEscala = await db.EscalaJantar.findOne({
    where: { ordem: proximaOrdem, status: "ativo" },
  });

  if (!proximoNaEscala) {
    return {
      responsavelNome: "Não definido na escala",
      conjugeNome: "Não definido",
    };
  }

  const responsavel = await db.LodgeMember.findByPk(proximoNaEscala.membroId);
  if (!responsavel) {
    return { responsavelNome: "Responsável não encontrado", conjugeNome: "" };
  }

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

  // Ajuste para garantir que a data final inclua o dia inteiro
  dataFim.setHours(23, 59, 59, 999);

  const [jantar, aniversariantes] = await Promise.all([
    findDinnerResponsible(),
    findAnniversaries(dataInicio, dataFim),
  ]);

  // Formatando a resposta para o formato exato solicitado
  return {
    jantar,
    aniversariantes: {
      membros: aniversariantes.nascimentos.membros,
      familiares: aniversariantes.nascimentos.familiares,
      casamentos: aniversariantes.casamentos,
      maconicos: aniversariantes.maconicos,
    },
  };
};
