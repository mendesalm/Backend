// backend/controllers/relatorios.controller.js
import db from "../models/index.js";
import {
  gerarPdfFrequencia,
  gerarPdfVisitacoes,
  gerarPdfMembros,
  gerarPdfAniversariantes,
  gerarPdfBalancete,
  gerarPdfCargosGestao,
  gerarPdfDatasMaconicas,
  gerarPdfEmprestimos,
  gerarPdfComissoes,
  gerarPdfPatrimonio,
} from "../utils/pdfGenerator.js";

const { Op, fn, col } = db.Sequelize;

/**
 * Função auxiliar genérica para enviar um buffer de PDF na resposta.
 */
const enviarPdf = (res, pdfBuffer, nomeArquivo) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${nomeArquivo}`);
  res.send(pdfBuffer);
};

// --- Funções de Geração de Relatórios ---

export const gerarRelatorioFrequencia = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    const totalSessoesNoPeriodo = await db.MasonicSession.count({
      where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } },
    });
    if (totalSessoesNoPeriodo === 0) {
      return res.status(404).json({
        message: "Nenhuma sessão encontrada no período para gerar o relatório.",
      });
    }

    const membrosAtivos = await db.LodgeMember.findAll({
      attributes: ["id", "NomeCompleto"],
      where: { Situacao: "Ativo" },
      order: [["NomeCompleto", "ASC"]],
    });

    const presencasCount = await db.SessionAttendee.findAll({
      attributes: [
        "lodgeMemberId",
        [fn("COUNT", col("sessionId")), "presencas"],
      ],
      include: [
        {
          model: db.MasonicSession,
          attributes: [],
          where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } },
        },
      ],
      group: ["lodgeMemberId"],
      raw: true,
    });

    const presencasMap = new Map(
      presencasCount.map((item) => [item.lodgeMemberId, item.presencas])
    );

    const dadosFrequencia = membrosAtivos.map((membro) => {
      const presencas = parseInt(presencasMap.get(membro.id) || 0, 10);
      return {
        nome: membro.NomeCompleto,
        presencas: presencas,
        totalSessoes: totalSessoesNoPeriodo,
        percentual:
          totalSessoesNoPeriodo > 0
            ? (presencas / totalSessoesNoPeriodo) * 100
            : 0,
      };
    });
    const pdfBuffer = await gerarPdfFrequencia(
      dadosFrequencia,
      new Date(dataInicio).toLocaleDateString("pt-BR"),
      new Date(dataFim).toLocaleDateString("pt-BR")
    );
    enviarPdf(res, pdfBuffer, `Relatorio_Frequencia.pdf`);
  } catch (error) {
    console.error("Erro ao gerar relatório de frequência:", error);
    res.status(500).json({
      message: "Erro ao gerar relatório de frequência.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioVisitacoes = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    const visitacoes = await db.Visita.findAll({
      where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } },
      include: [
        {
          model: db.LodgeMember,
          as: "visitante",
          attributes: ["NomeCompleto"],
        },
      ],
      order: [
        ["dataSessao", "ASC"],
        [col("visitante.NomeCompleto"), "ASC"],
      ],
    });
    const pdfBuffer = await gerarPdfVisitacoes(
      visitacoes,
      new Date(dataInicio).toLocaleDateString("pt-BR"),
      new Date(dataFim).toLocaleDateString("pt-BR")
    );
    enviarPdf(res, pdfBuffer, `Relatorio_Visitacoes.pdf`);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de visitações.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioMembros = async (req, res) => {
  try {
    const membros = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      order: [["NomeCompleto", "ASC"]],
    });
    const pdfBuffer = await gerarPdfMembros(membros);
    enviarPdf(res, pdfBuffer, "Quadro_de_Obreiros.pdf");
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de membros.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioAniversariantes = async (req, res) => {
  const { mes } = req.query;
  try {
    const mesNum = parseInt(mes, 10);
    const membros = await db.LodgeMember.findAll({
      where: {
        Situacao: "Ativo",
        [Op.and]: [
          db.sequelize.where(fn("MONTH", col("DataNascimento")), mesNum),
        ],
      },
    });
    const familiares = await db.FamilyMember.findAll({
      where: {
        [Op.and]: [
          db.sequelize.where(
            fn("MONTH", col("FamilyMember.dataNascimento")),
            mesNum
          ),
        ],
      },
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          where: { Situacao: "Ativo" },
          required: true,
        },
      ],
    });

    let aniversariantes = [
      ...membros.map((m) => ({
        nome: m.NomeCompleto,
        data: new Date(m.DataNascimento).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        }),
        tipo: "Irmão do Quadro",
      })),
      ...familiares.map((f) => ({
        nome: f.nomeCompleto,
        data: new Date(f.dataNascimento).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        }),
        tipo: `${
          f.parentesco === "Cônjuge" ? "Esposa" : f.parentesco
        } do Irmão ${f.membro.NomeCompleto}`,
      })),
    ];
    aniversariantes.sort(
      (a, b) =>
        parseInt(a.data.substring(0, 2)) - parseInt(b.data.substring(0, 2))
    );

    const nomeMes = new Date(2000, mesNum - 1).toLocaleString("pt-BR", {
      month: "long",
    });
    const pdfBuffer = await gerarPdfAniversariantes(aniversariantes, nomeMes);
    enviarPdf(res, pdfBuffer, `Relatorio_Aniversariantes_${nomeMes}.pdf`);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de aniversariantes.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioFinanceiroDetalhado = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    const totais = {
      totalEntradas:
        (await db.Lancamento.sum("valor", {
          include: [
            { model: db.Conta, as: "conta", where: { tipo: "Receita" } },
          ],
          where: { dataLancamento: { [Op.between]: [dataInicio, dataFim] } },
        })) || 0,
      totalSaidas:
        (await db.Lancamento.sum("valor", {
          include: [
            { model: db.Conta, as: "conta", where: { tipo: "Despesa" } },
          ],
          where: { dataLancamento: { [Op.between]: [dataInicio, dataFim] } },
        })) || 0,
    };
    totais.saldoPeriodo = totais.totalEntradas - totais.totalSaidas;

    const lancamentos = await db.Lancamento.findAll({
      where: { dataLancamento: { [Op.between]: [dataInicio, dataFim] } },
      include: [{ model: db.Conta, as: "conta" }],
      order: [["dataLancamento", "ASC"]],
    });

    const periodo = {
      inicio: new Date(dataInicio).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      fim: new Date(dataFim).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
    };
    const pdfBuffer = await gerarPdfBalancete({ totais, lancamentos, periodo });
    enviarPdf(res, pdfBuffer, "Balancete_Financeiro.pdf");
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro detalhado:", error);
    res.status(500).json({
      message: "Erro ao gerar relatório financeiro detalhado.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioCargosGestao = async (req, res) => {
  try {
    const cargos = await db.CargoExercido.findAll({
      where: { dataTermino: null },
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["NomeCompleto"],
          required: true,
        },
      ],
      order: [["nomeCargo", "ASC"]],
    });
    const pdfBuffer = await gerarPdfCargosGestao(cargos);
    enviarPdf(res, pdfBuffer, "Relatorio_Cargos_Gestao_Atual.pdf");
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de cargos.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioDatasMaconicas = async (req, res) => {
  const { mes } = req.query;
  try {
    const mesNum = parseInt(mes, 10);
    const membros = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      attributes: [
        "NomeCompleto",
        "DataIniciacao",
        "DataElevacao",
        "DataExaltacao",
      ],
    });

    let datasComemorativas = [];
    const anoAtual = new Date().getFullYear();
    const addData = (membro, data, tipoAniversario) => {
      if (data && new Date(data).getUTCMonth() + 1 === mesNum) {
        // --- CORREÇÃO APLICADA AQUI ---
        // As chaves do objeto agora correspondem ao que o pdfGenerator espera
        datasComemorativas.push({
          nome: membro.NomeCompleto,
          data: new Date(data).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
          }),
          tipo: tipoAniversario,
          anosComemorados: anoAtual - new Date(data).getFullYear(),
        });
      }
    };
    membros.forEach((m) => {
      addData(m, m.DataIniciacao, "Iniciação");
      addData(m, m.DataElevacao, "Elevação");
      addData(m, m.DataExaltacao, "Exaltação");
    });

    datasComemorativas.sort(
      (a, b) =>
        parseInt(a.data.substring(0, 2)) - parseInt(b.data.substring(0, 2))
    );

    const nomeMes = new Date(2000, mesNum - 1).toLocaleString("pt-BR", {
      month: "long",
    });
    const pdfBuffer = await gerarPdfDatasMaconicas(datasComemorativas, nomeMes);
    enviarPdf(res, pdfBuffer, `Relatorio_Datas_Maconicas_${nomeMes}.pdf`);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de datas maçônicas.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioEmprestimos = async (req, res) => {
  try {
    const emprestimos = await db.Emprestimo.findAll({
      where: { dataDevolucaoReal: null },
      include: [
        { model: db.Biblioteca, as: "livro" },
        { model: db.LodgeMember, as: "membro" },
      ],
      order: [["dataDevolucaoPrevista", "ASC"]],
    });
    const pdfBuffer = await gerarPdfEmprestimos(emprestimos);
    enviarPdf(res, pdfBuffer, "Relatorio_Emprestimos_Ativos.pdf");
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório da biblioteca.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioComissoes = async (req, res) => {
  try {
    const comissoes = await db.Comissao.findAll({
      include: [
        {
          model: db.LodgeMember,
          as: "membros",
          attributes: ["NomeCompleto"],
          through: { attributes: ["cargo"] },
        },
      ],
      order: [["nome", "ASC"]],
    });
    const pdfBuffer = await gerarPdfComissoes(comissoes);
    enviarPdf(res, pdfBuffer, `Relatorio_Comissoes.pdf`);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório de comissões.",
      errorDetails: error.message,
    });
  }
};

export const gerarRelatorioPatrimonio = async (req, res) => {
  try {
    const todosItens = await db.Patrimonio.findAll({
      order: [["nome", "ASC"]],
    });
    if (!todosItens || todosItens.length === 0) {
      return res.status(404).json({
        message: "Nenhum item de patrimônio encontrado para gerar o relatório.",
      });
    }
    const pdfBuffer = await gerarPdfPatrimonio(todosItens);
    enviarPdf(res, pdfBuffer, `Relatorio_Patrimonio.pdf`);
  } catch (error) {
    console.error("Erro ao gerar relatório de patrimônio:", error);
    res.status(500).json({
      message: "Erro ao gerar relatório de patrimônio.",
      errorDetails: error.message,
    });
  }
};
