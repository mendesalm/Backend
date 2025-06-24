// services/emprestimoPatrimonio.service.js
import db from "../models/index.js";
import { Op } from "sequelize";

/**
 * Verifica se os itens e suas quantidades solicitadas estão disponíveis para um determinado período.
 * @param {Array<{patrimonioId: number, quantidade: number}>} itensSolicitados - Array com os itens e quantidades.
 * @param {Date} dataRetirada - Data de início do empréstimo.
 * @param {Date} dataDevolucaoPrevista - Data de fim do empréstimo.
 * @param {number|null} emprestimoIdExcluido - ID de um empréstimo a ser ignorado na checagem (para atualizações).
 * @returns {Promise<{disponivel: boolean, detalhes: Array<string>}>}
 */
export const verificarDisponibilidadeItens = async (
  itensSolicitados,
  dataRetirada,
  dataDevolucaoPrevista,
  emprestimoIdExcluido = null
) => {
  let todosDisponiveis = true;
  const detalhesIndisponibilidade = [];

  for (const item of itensSolicitados) {
    // 1. Encontrar o item do patrimônio para saber a quantidade total em estoque.
    const patrimonio = await db.Patrimonio.findByPk(item.patrimonioId);
    if (!patrimonio) {
      todosDisponiveis = false;
      detalhesIndisponibilidade.push(
        `Item com ID ${item.patrimonioId} não encontrado no patrimônio.`
      );
      continue;
    }
    const quantidadeTotalEstoque = patrimonio.quantidade;

    // 2. Calcular quantos deste item já estão emprestados no período solicitado.
    const emprestimosConflitantes = await db.EmprestimoPatrimonio.findAll({
      where: {
        id: { [Op.ne]: emprestimoIdExcluido }, // Exclui o próprio empréstimo (em caso de edição)
        status: { [Op.in]: ["Aprovado", "Retirado"] }, // Considera apenas empréstimos ativos
        // Lógica de sobreposição de datas
        [Op.or]: [
          {
            dataRetirada: {
              [Op.between]: [dataRetirada, dataDevolucaoPrevista],
            },
          },
          {
            dataDevolucaoPrevista: {
              [Op.between]: [dataRetirada, dataDevolucaoPrevista],
            },
          },
          {
            [Op.and]: [
              { dataRetirada: { [Op.lte]: dataRetirada } },
              { dataDevolucaoPrevista: { [Op.gte]: dataDevolucaoPrevista } },
            ],
          },
        ],
      },
      include: [
        {
          model: db.Patrimonio,
          as: "itens",
          where: { id: item.patrimonioId },
          required: true, // Garante que só peguemos empréstimos que contenham este item
        },
      ],
    });

    let quantidadeJaEmprestada = 0;
    emprestimosConflitantes.forEach((emp) => {
      // O Sequelize retorna os dados da tabela de junção dentro do array 'itens'
      const itemEmprestado = emp.itens[0].ItemEmprestimoPatrimonio;
      quantidadeJaEmprestada += itemEmprestado.quantidadeEmprestada;
    });

    // 3. Verificar se a quantidade disponível é suficiente.
    const quantidadeDisponivel =
      quantidadeTotalEstoque - quantidadeJaEmprestada;

    if (quantidadeDisponivel < item.quantidade) {
      todosDisponiveis = false;
      detalhesIndisponibilidade.push(
        `Item "${patrimonio.nome}": Solicitado ${item.quantidade}, mas apenas ${quantidadeDisponivel} disponíveis no período.`
      );
    }
  }

  return { disponivel: todosDisponiveis, detalhes: detalhesIndisponibilidade };
};

/**
 * Cria o lançamento financeiro correspondente a uma locação de patrimônio.
 * @param {object} emprestimo - A instância do modelo EmprestimoPatrimonio.
 * @param {string} nomeConta - O nome da conta de destino da receita.
 * @param {object} transaction - A transação do Sequelize.
 * @returns {Promise<object>} A instância do modelo Lancamento criada.
 */
export const criarLancamentoFinanceiroPatrimonio = async (
  emprestimo,
  nomeConta,
  transaction
) => {
  const conta = await db.Conta.findOne({ where: { nome: nomeConta } });
  if (!conta) {
    throw new Error(
      `A conta financeira "${nomeConta}" não foi encontrada. Por favor, cadastre-a no Plano de Contas.`
    );
  }

  const lancamento = await db.Lancamento.create(
    {
      descricao: `Receita da Locação de Patrimônio - ${
        emprestimo.finalidade || `ID ${emprestimo.id}`
      }`,
      valor: emprestimo.valorCobrado,
      data: emprestimo.dataRetirada,
      tipo: "Entrada",
      contaId: conta.id,
    },
    { transaction }
  );

  return lancamento;
};
