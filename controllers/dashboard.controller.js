// controllers/dashboard.controller.js
import db from "../models/index.js";
const { Sequelize } = db;
const { Op } = Sequelize;

// --- Funções Auxiliares ---

const getResumoFinanceiroMesAtual = async () => {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const lancamentosDoMes = await db.Lancamento.findAll({
    where: { dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } },
    include: [{ model: db.Conta, as: "conta", attributes: ["tipo"] }],
    raw: true,
    nest: true,
  });

  const totais = lancamentosDoMes.reduce(
    (acc, lancamento) => {
      if (lancamento.conta.tipo === "Receita") {
        acc.totalReceitas += parseFloat(lancamento.valor);
      } else if (lancamento.conta.tipo === "Despesa") {
        acc.totalDespesas += parseFloat(lancamento.valor);
      }
      return acc;
    },
    { totalReceitas: 0, totalDespesas: 0 }
  );

  return {
    periodo: hoje.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
    totalReceitas: totais.totalReceitas,
    totalDespesas: totais.totalDespesas,
    saldo: totais.totalReceitas - totais.totalDespesas,
  };
};

const getProximosAniversariantes = async (dias = 30) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataLimite = new Date(hoje);
  dataLimite.setDate(hoje.getDate() + dias);

  const membros = await db.LodgeMember.findAll({
    where: { Situacao: "Ativo" },
    attributes: ["NomeCompleto", "DataNascimento"],
  });

  const familiares = await db.FamilyMember.findAll({
    include: [
      {
        model: db.LodgeMember,
        as: "membro",
        attributes: [],
        where: { Situacao: "Ativo" },
        required: true,
      },
    ],
    attributes: ["nomeCompleto", "dataNascimento", "parentesco"],
  });

  const todos = [
    ...membros.map((m) => ({
      nome: m.NomeCompleto,
      data: m.DataNascimento,
      tipo: "Membro",
    })),
    ...familiares.map((f) => ({
      nome: f.nomeCompleto,
      data: f.dataNascimento,
      tipo: `Familiar (${f.parentesco})`,
    })),
  ];

  const aniversariantesFiltrados = todos.filter((pessoa) => {
    if (!pessoa.data) return false;
    const dataNasc = new Date(pessoa.data);
    const aniversarioEsteAno = new Date(
      hoje.getFullYear(),
      dataNasc.getMonth(),
      dataNasc.getDate()
    );
    if (aniversarioEsteAno < hoje) {
      const aniversarioProximoAno = new Date(
        hoje.getFullYear() + 1,
        dataNasc.getMonth(),
        dataNasc.getDate()
      );
      return aniversarioProximoAno <= dataLimite;
    }
    return aniversarioEsteAno <= dataLimite;
  });

  aniversariantesFiltrados.sort((a, b) => {
    const dataA = new Date(a.data);
    dataA.setFullYear(hoje.getFullYear());
    if (dataA < hoje) dataA.setFullYear(hoje.getFullYear() + 1);
    const dataB = new Date(b.data);
    dataB.setFullYear(hoje.getFullYear());
    if (dataB < hoje) dataB.setFullYear(hoje.getFullYear() + 1);
    return dataA - dataB;
  });

  return aniversariantesFiltrados.map((pessoa) => ({
    nome: pessoa.nome,
    data: new Date(pessoa.data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    tipo: pessoa.tipo,
  }));
};

const getProximosEventos = async (dias = 7) => {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + dias);
  return await db.Evento.findAll({
    where: { dataHoraInicio: { [Op.between]: [hoje, dataLimite] } },
    order: [["dataHoraInicio", "ASC"]],
    limit: 5,
    attributes: ["id", ["titulo", "nome"], "dataHoraInicio", "local"],
  });
};

const getEmprestimosPendentes = async (membroId) => {
  return await db.Emprestimo.findAll({
    where: { membroId, dataDevolucaoReal: null },
    include: [
      { model: db.Biblioteca, as: "livro", attributes: ["id", "titulo"] },
    ],
    order: [["dataDevolucaoPrevista", "ASC"]],
  });
};

// --- CONTROLLERS EXPORTADOS ---

export const getDashboardData = async (req, res) => {
  try {
    const { credencialAcesso, id: membroId } = req.user;
    let dashboardData = {};
    const [proximosEventos, proximosAniversariantes] = await Promise.all([
      getProximosEventos(),
      getProximosAniversariantes(30),
    ]);

    if (["Admin", "Webmaster", "Diretoria"].includes(credencialAcesso)) {
      const [resumoFinanceiro, totalMembros] = await Promise.all([
        getResumoFinanceiroMesAtual(),
        db.LodgeMember.count({ where: { Situacao: "Ativo" } }),
      ]);
      dashboardData = {
        tipo: "admin",
        resumoFinanceiro,
        totalMembros,
        proximosAniversariantes,
        proximosEventos,
      };
    } else {
      const emprestimosPendentes = await getEmprestimosPendentes(membroId);
      dashboardData = {
        tipo: "membro",
        emprestimosPendentes,
        proximosEventos,
        proximosAniversariantes,
      };
    }
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Erro ao gerar dados do dashboard:", error);
    res.status(500).json({
      message: "Erro ao gerar dados do dashboard.",
      errorDetails: error.message,
    });
  }
};

export const getCalendarioUnificado = async (req, res) => {
  const { ano, mes } = req.query;
  try {
    const numAno = parseInt(ano, 10);
    const numMes = parseInt(mes, 10);
    if (isNaN(numAno) || isNaN(numMes)) {
      return res
        .status(400)
        .json({ message: "Ano e mês devem ser números válidos." });
    }
    const dataInicio = new Date(numAno, numMes - 1, 1);
    const dataFim = new Date(numAno, numMes, 0, 23, 59, 59);

    // Buscas em paralelo
    const sessoesPromise = db.MasonicSession.findAll({
      where: { DataSessao: { [Op.between]: [dataInicio, dataFim] } },
    });
    const locacoesPromise = db.LocacaoSalao.findAll({
      where: {
        status: "Confirmado",
        dataInicio: { [Op.between]: [dataInicio, dataFim] },
      },
    });
    const eventosPromise = db.Evento.findAll({
      where: { dataHoraInicio: { [Op.between]: [dataInicio, dataFim] } },
    });

    const [sessoes, locacoes, eventosSociais] = await Promise.all([
      sessoesPromise,
      locacoesPromise,
      eventosPromise,
    ]);

    const eventosSessao = sessoes
      .filter((s) => s.dataSessao)
      .map((s) => {
        // ** CORREÇÃO DE FUSO HORÁRIO APLICADA AQUI **
        // Transforma a data DATEONLY em uma string AAAA-MM-DD para evitar conversões de fuso horário.
        const dataObj = new Date(s.dataSessao);
        const anoSessao = dataObj.getUTCFullYear();
        const mesSessao = String(dataObj.getUTCMonth() + 1).padStart(2, "0");
        const diaSessao = String(dataObj.getUTCDate()).padStart(2, "0");
        const dataFormatada = `${anoSessao}-${mesSessao}-${diaSessao}`;

        return {
          id: `sessao-${s.id}`,
          titulo: `Sessão ${s.tipoSessao || "a Definir"} no grau de ${
            s.subtipoSessao || ""
          }`.trim(),
          data: `${dataFormatada}T19:00:00`, // Adiciona uma hora fixa para o frontend
          tipo: "Sessão",
          status: "Confirmado",
        };
      });

    const eventosLocacao = locacoes.map((l) => ({
      id: `locacao-${l.id}`,
      titulo: `Salão Alugado: ${l.finalidade}`,
      data: l.dataInicio,
      tipo: "Locação",
      status: l.status,
    }));
    const eventosRegistrados = eventosSociais.map((e) => ({
      id: `evento-${e.id}`,
      titulo: e.nome,
      data: e.dataHoraInicio,
      tipo: "Evento",
      status: e.status,
    }));

    let todosOsEventos = [
      ...eventosSessao,
      ...eventosLocacao,
      ...eventosRegistrados,
    ];
    todosOsEventos.sort((a, b) => new Date(a.data) - new Date(b.data));

    res.status(200).json(todosOsEventos);
  } catch (error) {
    console.error("Erro ao buscar calendário unificado:", error);
    res
      .status(500)
      .json({
        message: "Erro ao buscar dados do calendário.",
        errorDetails: error.message,
      });
  }
};
