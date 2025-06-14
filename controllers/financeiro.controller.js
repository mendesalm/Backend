// controllers/financeiro.controller.js
import db from "../models/index.js";
import { gerarPdfBalancete } from "../utils/pdfGenerator.js";
// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// --- CRUD para o Plano de Contas ---

export const createConta = async (req, res) => {
  try {
    const novaConta = await db.Conta.create(req.body);
    res.status(201).json(novaConta);
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res
        .status(400)
        .json({
          message: "Erro de validação ou nome da conta já existe.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({ message: "Erro ao criar conta.", errorDetails: error.message });
  }
};

export const getAllContas = async (req, res) => {
  try {
    const contas = await db.Conta.findAll({
      order: [
        ["tipo", "ASC"],
        ["nome", "ASC"],
      ],
    });
    res.status(200).json(contas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar contas.", errorDetails: error.message });
  }
};

export const getContaById = async (req, res) => {
  try {
    const conta = await db.Conta.findByPk(req.params.id);
    if (!conta) {
      return res.status(404).json({ message: "Conta não encontrada." });
    }
    res.status(200).json(conta);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar conta.", errorDetails: error.message });
  }
};

export const updateConta = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.Conta.update(req.body, { where: { id: id } });
    if (!updated) {
      return res.status(404).json({ message: "Conta não encontrada." });
    }
    const updatedConta = await db.Conta.findByPk(id);
    res.status(200).json(updatedConta);
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res
        .status(400)
        .json({
          message: "Erro de validação ou nome da conta já existe.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({
        message: "Erro ao atualizar conta.",
        errorDetails: error.message,
      });
  }
};

export const deleteConta = async (req, res) => {
  try {
    const { id } = req.params;
    const lancamentosCount = await db.Lancamento.count({
      where: { contaId: id },
    });
    if (lancamentosCount > 0) {
      return res.status(409).json({
        message: `Não é possível deletar esta conta, pois ela já possui ${lancamentosCount} lançamento(s) associado(s).`,
      });
    }
    const deleted = await db.Conta.destroy({ where: { id: id } });
    if (!deleted) {
      return res.status(404).json({ message: "Conta não encontrada." });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao deletar conta.", errorDetails: error.message });
  }
};

// --- CRUD para Lançamentos ---

export const createLancamento = async (req, res) => {
  const {
    descricao,
    valor,
    dataLancamento,
    contaId,
    membroId,
    comprovanteUrl,
  } = req.body;
  const criadoPorId = req.user.id;
  try {
    const novoLancamento = await db.Lancamento.create({
      descricao,
      valor,
      dataLancamento,
      contaId,
      membroId: membroId || null,
      comprovanteUrl: comprovanteUrl || null,
      criadoPorId,
    });
    res.status(201).json(novoLancamento);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao criar lançamento.",
        errorDetails: error.message,
      });
  }
};

export const getAllLancamentos = async (req, res) => {
  const { mes, ano, tipo, contaId } = req.query;
  const whereClause = {};
  const { Op } = db.Sequelize;

  if (mes && ano) {
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0);
    whereClause.dataLancamento = { [Op.between]: [startDate, endDate] };
  }
  if (contaId) {
    whereClause.contaId = contaId;
  }

  const includeContaWhere = {};
  if (tipo) {
    includeContaWhere.tipo = tipo;
  }

  try {
    const lancamentos = await db.Lancamento.findAll({
      where: whereClause,
      include: [
        {
          model: db.Conta,
          as: "conta",
          where: includeContaWhere,
          required: true,
        },
        {
          model: db.LodgeMember,
          as: "membroAssociado",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
        {
          model: db.LodgeMember,
          as: "criadoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
      ],
      order: [["dataLancamento", "DESC"]],
    });
    res.status(200).json(lancamentos);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar lançamentos.",
        errorDetails: error.message,
      });
  }
};

// --- FUNÇÕES DE ORÇAMENTO ---

export const setOrcamento = async (req, res) => {
  const { contaId, ano, valorOrcado } = req.body;
  try {
    const [orcamento, created] = await db.Orcamento.findOrCreate({
      where: { contaId, ano },
      defaults: { valorOrcado },
    });

    if (!created) {
      orcamento.valorOrcado = valorOrcado;
      await orcamento.save();
    }
    res.status(created ? 201 : 200).json(orcamento);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao definir orçamento.",
        errorDetails: error.message,
      });
  }
};

export const getRelatorioOrcamentario = async (req, res) => {
  const { ano } = req.query;
  if (!ano) {
    return res
      .status(400)
      .json({
        message: "O ano é obrigatório para gerar o relatório orçamentário.",
      });
  }
  try {
    const { Op, fn, col } = db.Sequelize;
    const contas = await db.Conta.findAll({
      include: [
        {
          model: db.Orcamento,
          as: "orcamentos",
          where: { ano },
          required: false,
        },
      ],
      order: [
        ["tipo", "ASC"],
        ["nome", "ASC"],
      ],
    });

    const lancamentosAgregados = await db.Lancamento.findAll({
      attributes: ["contaId", [fn("SUM", col("valor")), "valorRealizado"]],
      where: {
        dataLancamento: { [Op.between]: [`${ano}-01-01`, `${ano}-12-31`] },
      },
      group: ["contaId"],
    });

    const realizadosMap = new Map(
      lancamentosAgregados.map((item) => [
        item.contaId,
        parseFloat(item.get("valorRealizado")),
      ])
    );

    const relatorio = contas.map((conta) => {
      const orcado =
        conta.orcamentos && conta.orcamentos[0]
          ? parseFloat(conta.orcamentos[0].valorOrcado)
          : 0;
      const realizado = realizadosMap.get(conta.id) || 0;
      const diferenca = orcado - realizado;
      return {
        contaId: conta.id,
        nomeConta: conta.nome,
        tipo: conta.tipo,
        valorOrcado: orcado,
        valorRealizado: realizado,
        diferenca: diferenca,
      };
    });

    res.status(200).json(relatorio);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao gerar relatório orçamentário.",
        errorDetails: error.message,
      });
  }
};

// --- Relatórios ---

export const getBalancete = async (req, res) => {
  const { mes, ano } = req.query;
  if (!mes || !ano) {
    return res
      .status(400)
      .json({ message: "Mês e ano são obrigatórios para gerar o balancete." });
  }

  try {
    const dadosBalancete = await getBalanceteData(mes, ano);
    res.status(200).json(dadosBalancete);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao gerar balancete.",
        errorDetails: error.message,
      });
  }
};

export const exportBalancetePDF = async (req, res) => {
  const { mes, ano } = req.query;
  if (!mes || !ano) {
    return res
      .status(400)
      .json({ message: "Mês e ano são obrigatórios para gerar o relatório." });
  }

  try {
    const dadosBalancete = await getBalanceteData(mes, ano);
    const lancamentos = await getAllLancamentosData(mes, ano);
    const pdfDoc = gerarPdfBalancete(dadosBalancete, lancamentos);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Balancete_${String(mes).padStart(
        2,
        "0"
      )}_${ano}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Erro ao gerar PDF do balancete:", error);
    res
      .status(500)
      .json({
        message: "Erro ao gerar relatório em PDF.",
        errorDetails: error.message,
      });
  }
};

// Funções auxiliares para buscar os dados e evitar repetição de código
async function getBalanceteData(mes, ano) {
  const { Op } = db.Sequelize;
  const startDate = new Date(ano, mes - 1, 1);
  const endDate = new Date(ano, mes, 0);

  const totalReceitas = await db.Lancamento.sum("valor", {
    where: { dataLancamento: { [Op.between]: [startDate, endDate] } },
    include: [{ model: db.Conta, as: "conta", where: { tipo: "Receita" } }],
  });
  const totalDespesas = await db.Lancamento.sum("valor", {
    where: { dataLancamento: { [Op.between]: [startDate, endDate] } },
    include: [{ model: db.Conta, as: "conta", where: { tipo: "Despesa" } }],
  });
  const saldo = (totalReceitas || 0) - (totalDespesas || 0);

  return {
    periodo: `${String(mes).padStart(2, "0")}/${ano}`,
    totalReceitas: totalReceitas || 0,
    totalDespesas: totalDespesas || 0,
    saldo: saldo,
  };
}

async function getAllLancamentosData(mes, ano) {
  const { Op } = db.Sequelize;
  const startDate = new Date(ano, mes - 1, 1);
  const endDate = new Date(ano, mes, 0);

  return await db.Lancamento.findAll({
    where: { dataLancamento: { [Op.between]: [startDate, endDate] } },
    include: [{ model: db.Conta, as: "conta", required: true }],
    order: [["dataLancamento", "ASC"]],
  });
}
