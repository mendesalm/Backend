// controllers/emprestimoPatrimonio.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";
import {
  verificarDisponibilidadeItens,
  criarLancamentoFinanceiroPatrimonio,
} from "../services/emprestimoPatrimonio.service.js";

const NOME_CONTA_RECEITA = "Receita - Locação de Itens";

// Helper para verificar permissão (Admin) - Simplificado
const isAdmin = (user) => user && user.credencialAcesso === "Admin";

/**
 * Cria uma nova solicitação de empréstimo de patrimônio.
 */
export const createEmprestimo = async (req, res) => {
  const { itens, ...dadosGerais } = req.body;
  const lodgeMemberId = req.user.id;

  if (!itens || itens.length === 0) {
    return res
      .status(400)
      .json({ message: "É necessário solicitar pelo menos um item." });
  }

  // 1. Verifica a disponibilidade de todos os itens solicitados
  const disponibilidade = await verificarDisponibilidadeItens(
    itens,
    new Date(dadosGerais.dataRetirada),
    new Date(dadosGerais.dataDevolucaoPrevista)
  );
  if (!disponibilidade.disponivel) {
    return res
      .status(409)
      .json({
        message: "Itens indisponíveis no período solicitado.",
        detalhes: disponibilidade.detalhes,
      });
  }

  const t = await db.sequelize.transaction();
  try {
    // 2. Cria o registro principal do empréstimo
    const novoEmprestimo = await db.EmprestimoPatrimonio.create(
      {
        ...dadosGerais,
        lodgeMemberId: dadosGerais.lodgeMemberId || lodgeMemberId, // Associa ao solicitante se não for para terceiro
        status: "Solicitado",
      },
      { transaction: t }
    );

    // 3. Associa os itens e suas quantidades ao empréstimo
    const itensParaSalvar = itens.map((item) => ({
      emprestimoId: novoEmprestimo.id,
      patrimonioId: item.patrimonioId,
      quantidadeEmprestada: item.quantidade,
    }));
    await db.ItemEmprestimoPatrimonio.bulkCreate(itensParaSalvar, {
      transaction: t,
    });

    await t.commit();
    res
      .status(201)
      .json({
        message: "Solicitação de locação de patrimônio criada com sucesso!",
        data: novoEmprestimo,
      });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao criar empréstimo de patrimônio:", error);
    res
      .status(500)
      .json({
        message: "Erro interno ao criar solicitação.",
        errorDetails: error.message,
      });
  }
};

/**
 * Atualiza o status de um empréstimo (Aprovar, Retirar, Devolver, Cancelar)
 */
export const updateStatusEmprestimo = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["Aprovado", "Retirado", "Devolvido", "Cancelado"];

  if (!status || !validStatuses.includes(status)) {
    return res
      .status(400)
      .json({
        message: `Status inválido. Status permitidos: ${validStatuses.join(
          ", "
        )}`,
      });
  }

  const t = await db.sequelize.transaction();
  try {
    const emprestimo = await db.EmprestimoPatrimonio.findByPk(id);
    if (!emprestimo)
      return res
        .status(404)
        .json({ message: "Solicitação de locação não encontrada." });

    // Lógica para aprovação com lançamento financeiro
    if (
      status === "Aprovado" &&
      !emprestimo.ehNaoOneroso &&
      emprestimo.valorCobrado > 0
    ) {
      const lancamento = await criarLancamentoFinanceiroPatrimonio(
        emprestimo,
        NOME_CONTA_RECEITA,
        t
      );
      emprestimo.lancamentoId = lancamento.id;
    }

    // Atualiza o status
    emprestimo.status = status;

    // Se for devolução, registra a data
    if (status === "Devolvido") {
      emprestimo.dataDevolucaoReal = new Date();
    }

    await emprestimo.save({ transaction: t });
    await t.commit();

    res
      .status(200)
      .json({
        message: `Status da locação atualizado para "${status}" com sucesso!`,
        data: emprestimo,
      });
  } catch (error) {
    await t.rollback();
    console.error(`Erro ao atualizar status para "${status}":`, error);
    res
      .status(500)
      .json({
        message: "Erro interno ao atualizar status da locação.",
        errorDetails: error.message,
      });
  }
};

/**
 * Lista todos os empréstimos de patrimônio
 */
export const getAllEmprestimos = async (req, res) => {
  try {
    const emprestimos = await db.EmprestimoPatrimonio.findAll({
      order: [["dataRetirada", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "locatarioMembro",
          attributes: ["id", "NomeCompleto"],
        },
        {
          model: db.Patrimonio,
          as: "itens",
          attributes: ["id", "nome"],
          through: { attributes: ["quantidadeEmprestada"] }, // Inclui a quantidade da tabela de junção
        },
      ],
    });
    res.status(200).json(emprestimos);
  } catch (error) {
    console.error("Erro ao listar empréstimos:", error);
    res
      .status(500)
      .json({
        message: "Erro ao listar empréstimos de patrimônio.",
        errorDetails: error.message,
      });
  }
};
