// services/locacao.service.js
import db from "../models/index.js";
import { Op } from "sequelize";

const NOME_CONTA_LOCACAO = "Receita-Aluguel do Saão de festas";

/**
 * Verifica se um período está disponível para locação,
 * checando contra outras locações confirmadas e sessões maçônicas agendadas.
 * @param {Date} dataInicio - A data de início da locação desejada.
 * @param {Date} dataFim - A data de fim da locação desejada.
 * @param {number|null} locacaoIdExcluida - O ID de uma locação a ser ignorada na verificação (útil para atualizações).
 * @returns {Promise<{disponivel: boolean, motivo: string|null}>}
 */
export const verificarDisponibilidade = async (
  dataInicio,
  dataFim,
  locacaoIdExcluida = null
) => {
  const whereClause = {
    id: { [Op.ne]: locacaoIdExcluida }, // Exclui a própria locação da verificação
    status: "Confirmado",
    [Op.or]: [
      { dataInicio: { [Op.between]: [dataInicio, dataFim] } },
      { dataFim: { [Op.between]: [dataInicio, dataFim] } },
      {
        [Op.and]: [
          { dataInicio: { [Op.lte]: dataInicio } },
          { dataFim: { [Op.gte]: dataFim } },
        ],
      },
    ],
  };

  const locacaoConflitante = await db.LocacaoSalao.findOne({
    where: whereClause,
  });

  if (locacaoConflitante) {
    return {
      disponivel: false,
      motivo: `Data já reservada pela locação ID ${locacaoConflitante.id}.`,
    };
  }

  const sessaoConflitante = await db.MasonicSession.findOne({
    where: {
      DataSessao: {
        [Op.gte]: dataInicio.setHours(0, 0, 0, 0),
        [Op.lte]: dataFim.setHours(23, 59, 59, 999),
      },
    },
  });

  if (sessaoConflitante) {
    return {
      disponivel: false,
      motivo: `Data indisponível devido a uma sessão maçônica agendada.`,
    };
  }

  return { disponivel: true, motivo: null };
};

/**
 * Cria o lançamento financeiro correspondente a uma locação.
 * @param {object} locacao - A instância do modelo LocacaoSalao.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<object>} A instância do modelo Lancamento criada.
 */
export const criarLancamentoFinanceiro = async (locacao, transaction) => {
  const conta = await db.Conta.findOne({ where: { nome: NOME_CONTA_LOCACAO } });
  if (!conta) {
    throw new Error(
      `A conta financeira "${NOME_CONTA_LOCACAO}" não foi encontrada. Por favor, cadastre-a no Plano de Contas.`
    );
  }

  const lancamento = await db.Lancamento.create(
    {
      descricao: `Receita da Locação - ${locacao.finalidade}`,
      valor: locacao.valor,
      data: locacao.dataInicio,
      tipo: "Entrada",
      contaId: conta.id,
    },
    { transaction }
  );

  return lancamento;
};
