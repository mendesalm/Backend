// controllers/locacaoSalao.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";
import {
  verificarDisponibilidade,
  criarLancamentoFinanceiro,
} from "../services/locacao.service.js";

// Endpoint para o frontend buscar datas ocupadas e desenhar o calendário
export const getCalendarioOcupacao = async (req, res) => {
  const { ano, mes } = req.query;
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59);

  try {
    const locacoes = await db.LocacaoSalao.findAll({
      where: {
        status: "Confirmado",
        dataInicio: { [Op.between]: [dataInicio, dataFim] },
      },
      attributes: [
        ["dataInicio", "data"],
        ["finalidade", "titulo"],
      ],
    });
    const sessoes = await db.MasonicSession.findAll({
      where: { DataSessao: { [Op.between]: [dataInicio, dataFim] } },
      attributes: [
        ["DataSessao", "data"],
        ["TipoSessao", "titulo"],
      ],
    });
    res.status(200).json([...locacoes, ...sessoes]);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar ocupação do calendário.",
      errorDetails: error.message,
    });
  }
};

// Cria uma nova solicitação de locação (status Pendente)
export const createLocacao = async (req, res) => {
  const { dataInicio, dataFim, ...outrosDados } = req.body;
  const disponibilidade = await verificarDisponibilidade(
    new Date(dataInicio),
    new Date(dataFim)
  );

  if (!disponibilidade.disponivel) {
    return res
      .status(409)
      .json({ message: "Data indisponível.", motivo: disponibilidade.motivo });
  }

  try {
    const novaLocacao = await db.LocacaoSalao.create({
      dataInicio,
      dataFim,
      ...outrosDados,
    });
    res.status(201).json({
      message:
        "Solicitação de locação criada com sucesso. Aguardando confirmação.",
      data: novaLocacao,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao criar solicitação de locação.",
      errorDetails: error.message,
    });
  }
};

// Confirma uma locação e gera o lançamento financeiro, se aplicável
export const confirmarLocacao = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const locacao = await db.LocacaoSalao.findByPk(req.params.id);
    if (!locacao)
      return res.status(404).json({ message: "Locação não encontrada." });
    if (locacao.status === "Confirmado")
      return res
        .status(400)
        .json({ message: "Esta locação já foi confirmada." });

    let lancamento = null;
    if (!locacao.ehNaoOneroso && locacao.valor > 0) {
      lancamento = await criarLancamentoFinanceiro(locacao, t);
    }

    await locacao.update(
      {
        status: "Confirmado",
        lancamentoId: lancamento ? lancamento.id : null,
      },
      { transaction: t }
    );

    await t.commit();
    res
      .status(200)
      .json({ message: "Locação confirmada com sucesso!", data: locacao });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Erro ao confirmar locação.",
      errorDetails: error.message,
    });
  }
};

// Cancela uma locação
export const cancelarLocacao = async (req, res) => {
  try {
    const locacao = await db.LocacaoSalao.findByPk(req.params.id);
    if (!locacao)
      return res.status(404).json({ message: "Locação não encontrada." });

    // Nota: Cancelar não remove o lançamento financeiro. Isso deve ser um estorno manual pelo tesoureiro.
    await locacao.update({ status: "Cancelado" });
    res
      .status(200)
      .json({ message: "Locação cancelada com sucesso.", data: locacao });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao cancelar locação.",
      errorDetails: error.message,
    });
  }
};

// Funções CRUD padrão
export const getAllLocacoes = async (req, res) => {
  try {
    const locacoes = await db.LocacaoSalao.findAll({
      order: [["dataInicio", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "locatarioMembro",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });
    res.status(200).json(locacoes);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar locações.",
      errorDetails: error.message,
    });
  }
};
export const encerrarLocacao = async (req, res) => {
  try {
    const locacao = await db.LocacaoSalao.findByPk(req.params.id);
    if (!locacao)
      return res.status(404).json({ message: "Locação não encontrada." });

    // Regra de negócio: Só pode encerrar uma locação que estava confirmada
    if (locacao.status !== "Confirmado") {
      return res
        .status(400)
        .json({
          message: `Não é possível encerrar uma locação com status "${locacao.status}".`,
        });
    }

    await locacao.update({ status: "Concluído" });
    res
      .status(200)
      .json({ message: "Locação encerrada com sucesso.", data: locacao });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao encerrar locação.",
        errorDetails: error.message,
      });
  }
};
export const updateLocacao = async (req, res) => {
  // ... (lógica de atualização, lembrando de chamar verificarDisponibilidade com o ID da locação)
};

export const deleteLocacao = async (req, res) => {
  // ... (lógica de deleção)
};
