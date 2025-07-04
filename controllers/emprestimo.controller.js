// controllers/emprestimo.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";
// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Registrar um novo empréstimo (check-out)
export const registrarEmprestimo = async (req, res) => {
  const { livroId, membroId, dataDevolucaoPrevista } = req.body;
  const t = await db.sequelize.transaction();
  try {
    const livro = await db.Biblioteca.findByPk(livroId, { transaction: t }); // Usa db.Biblioteca
    if (!livro) {
      await t.rollback();
      return res.status(404).json({ message: "Livro não encontrado." });
    }
    if (livro.status !== "Disponível") {
      await t.rollback();
      return res
        .status(409)
        .json({
          message: `O livro "${livro.titulo}" não está disponível para empréstimo.`,
        });
    }
    const novoEmprestimo = await db.Emprestimo.create(
      {
        // Usa db.Emprestimo
        livroId,
        membroId,
        dataDevolucaoPrevista,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(novoEmprestimo);
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({
        message: "Erro ao registrar empréstimo.",
        errorDetails: error.message,
      });
  }
};

// Registrar uma devolução (check-in)
export const registrarDevolucao = async (req, res) => {
  const { emprestimoId } = req.params;
  const t = await db.sequelize.transaction();
  try {
    const emprestimo = await db.Emprestimo.findByPk(emprestimoId, {
      transaction: t,
    }); // Usa db.Emprestimo
    if (!emprestimo) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Registro de empréstimo não encontrado." });
    }
    if (emprestimo.dataDevolucaoReal) {
      await t.rollback();
      return res.status(409).json({ message: "Este livro já foi devolvido." });
    }
    emprestimo.dataDevolucaoReal = new Date();
    await emprestimo.save({ transaction: t });

    const livro = await db.Biblioteca.findByPk(emprestimo.livroId, {
      transaction: t,
    });
    if (livro) {
      livro.status = "Disponível";
      await livro.save({ transaction: t });
    }
    await t.commit();
    res.status(200).json(emprestimo);
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({
        message: "Erro ao registrar devolução.",
        errorDetails: error.message,
      });
  }
};

// Listar todos os empréstimos (com filtros)
export const listarTodosEmprestimos = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};

    if (status === "Emprestado") whereClause.dataDevolucaoReal = null;
    if (status === "Devolvido")
      whereClause.dataDevolucaoReal = { [db.Sequelize.Op.ne]: null };

    const emprestimos = await db.Emprestimo.findAll({
      // Usa db.Emprestimo
      where: whereClause,
      include: [
        { model: db.Biblioteca, as: "livro", attributes: ["id", "titulo"] }, // Usa db.Biblioteca
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["id", "NomeCompleto"],
        }, // Usa db.LodgeMember
      ],
      order: [["dataEmprestimo", "DESC"]],
    });

    if (status === "Atrasado") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const atrasados = emprestimos.filter(
        (e) =>
          e.dataDevolucaoReal === null &&
          new Date(e.dataDevolucaoPrevista) < hoje
      );
      return res.status(200).json(atrasados);
    }

    res.status(200).json(emprestimos);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao listar empréstimos.",
        errorDetails: error.message,
      });
  }
};

// Listar empréstimos de um membro específico
export const listarEmprestimosDoMembro = async (req, res) => {
  try {
    const { membroId } = req.params;
    const emprestimos = await db.Emprestimo.findAll({
      // Usa db.Emprestimo
      where: { membroId },
      include: [
        {
          model: db.Biblioteca,
          as: "livro",
          attributes: ["id", "titulo", "status"],
        },
      ], // Usa db.Biblioteca
      order: [["dataEmprestimo", "DESC"]],
    });
    res.status(200).json(emprestimos);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar empréstimos do membro.",
        errorDetails: error.message,
      });
  }
};
// --- NOVAS FUNÇÕES PARA O FLUXO DE SOLICITAÇÃO ---

/**
 * Cria uma nova solicitação de empréstimo.
 * Rota: POST /api/biblioteca/solicitar-emprestimo
 */
export const solicitarEmprestimo = async (req, res) => {
  const { livroId } = req.body;
  const membroId = req.user.id;

  try {
    const livro = await db.Biblioteca.findByPk(livroId);
    if (!livro) {
      return res.status(404).json({ message: "Livro não encontrado." });
    }
    if (livro.status !== "Disponível") {
      return res
        .status(409)
        .json({
          message:
            "Este livro não está disponível para solicitação no momento.",
        });
    }

    const solicitacaoExistente = await db.Emprestimo.findOne({
      where: { livroId, membroId, status: "solicitado" },
    });

    if (solicitacaoExistente) {
      return res
        .status(409)
        .json({
          message: "Você já possui uma solicitação pendente para este livro.",
        });
    }

    const novaSolicitacao = await db.Emprestimo.create({
      livroId,
      membroId,
      status: "solicitado",
    });

    res
      .status(201)
      .json({
        message: "Solicitação de empréstimo enviada com sucesso!",
        solicitacao: novaSolicitacao,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao criar solicitação de empréstimo.",
        errorDetails: error.message,
      });
  }
};

/**
 * Lista todas as solicitações de empréstimo pendentes.
 * Rota: GET /api/biblioteca/solicitacoes
 */
export const listarSolicitacoes = async (req, res) => {
  try {
    const solicitacoes = await db.Emprestimo.findAll({
      where: { status: "solicitado" },
      include: [
        { model: db.Biblioteca, as: "livro", attributes: ["id", "titulo"] },
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["id", "NomeCompleto"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json(solicitacoes);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao listar solicitações.",
        errorDetails: error.message,
      });
  }
};

/**
 * Aprova uma solicitação de empréstimo.
 * Rota: PUT /api/biblioteca/solicitacoes/:id/aprovar
 */
export const aprovarSolicitacao = async (req, res) => {
  const { id } = req.params;
  const t = await db.sequelize.transaction();
  try {
    const solicitacao = await db.Emprestimo.findByPk(id, { transaction: t });
    if (!solicitacao || solicitacao.status !== "solicitado") {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Solicitação não encontrada ou já processada." });
    }

    const livro = await db.Biblioteca.findByPk(solicitacao.livroId, {
      transaction: t,
      lock: true,
    });
    if (livro.status !== "Disponível") {
      await t.rollback();
      return res
        .status(409)
        .json({
          message: `O livro "${livro.titulo}" não está mais disponível.`,
        });
    }

    const dataEmprestimo = new Date();
    const dataDevolucaoPrevista = new Date();
    dataDevolucaoPrevista.setDate(dataEmprestimo.getDate() + 15); // Ex: 15 dias de empréstimo

    await solicitacao.update(
      {
        status: "aprovado",
        dataEmprestimo: dataEmprestimo.toISOString().slice(0, 10),
        dataDevolucaoPrevista: dataDevolucaoPrevista.toISOString().slice(0, 10),
      },
      { transaction: t }
    );

    await livro.update({ status: "Emprestado" }, { transaction: t });

    await t.commit();
    res
      .status(200)
      .json({
        message: "Solicitação aprovada e empréstimo registrado com sucesso!",
        emprestimo: solicitacao,
      });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({
        message: "Erro ao aprovar solicitação.",
        errorDetails: error.message,
      });
  }
};

/**
 * Rejeita uma solicitação de empréstimo.
 * Rota: PUT /api/biblioteca/solicitacoes/:id/rejeitar
 */
export const rejeitarSolicitacao = async (req, res) => {
  const { id } = req.params;
  try {
    const solicitacao = await db.Emprestimo.findByPk(id);
    if (!solicitacao || solicitacao.status !== "solicitado") {
      return res
        .status(404)
        .json({ message: "Solicitação não encontrada ou já processada." });
    }

    await solicitacao.update({ status: "rejeitado" });

    res.status(200).json({ message: "Solicitação de empréstimo rejeitada." });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao rejeitar solicitação.",
        errorDetails: error.message,
      });
  }
};
