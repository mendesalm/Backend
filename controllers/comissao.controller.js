// controllers/comissao.controller.js
import db from '../models/index.js';
import { Sequelize } from 'sequelize';

// Função auxiliar para formatar a resposta da comissão
const formatarRespostaComissao = (comissao) => {
  const comissaoJson = comissao.toJSON();

  // Garante que o presidente e os membros existam antes de formatar
  const presidente = comissaoJson.presidente;
  const membros = comissaoJson.membros || [];

  if (presidente) {
    // Adiciona o "(Presidente)" ao nome do presidente na lista de membros
    const membroPresidente = membros.find(m => m.id === presidente.id);
    if (membroPresidente) {
      membroPresidente.NomeCompleto = `${membroPresidente.NomeCompleto} (Presidente)`;
    }
  }

  // Remove o objeto `presidente` separado para evitar redundância
  delete comissaoJson.presidente;

  return comissaoJson;
};


// Criar uma nova comissão
export const createComissao = async (req, res) => {
  const { nome, descricao, tipo, dataInicio, dataFim, presidenteId, membrosIds } = req.body;
  const t = await db.sequelize.transaction();

  try {
    // 1. Validação
    if (!presidenteId) {
      return res.status(400).json({ message: 'O presidente da comissão é obrigatório.' });
    }
    if (!membrosIds || membrosIds.length < 2) {
      return res.status(400).json({ message: 'A comissão deve ter no mínimo 2 outros membros além do presidente.' });
    }
    if (membrosIds.includes(presidenteId)) {
      return res.status(400).json({ message: 'O presidente não pode ser listado duas vezes (como presidente e membro).' });
    }

    // Lista completa de membros
    const todosMembrosIds = [presidenteId, ...membrosIds];

    // 2. Criação da Comissão
    const novaComissao = await db.Comissao.create(
      {
        nome,
        descricao,
        tipo,
        dataInicio,
        dataFim,
        presidenteId,
        criadorId: req.user.id,
      },
      { transaction: t }
    );

    // 3. Associação dos Membros
    await novaComissao.setMembros(todosMembrosIds, { transaction: t });

    await t.commit();

    // 4. Resposta Final
    const comissaoCompleta = await db.Comissao.findByPk(novaComissao.id, {
      include: [
        {
          model: db.LodgeMember,
          as: 'membros',
          attributes: ['id', 'NomeCompleto'],
          through: { attributes: [] },
        },
        {
          model: db.LodgeMember,
          as: 'presidente',
          attributes: ['id', 'NomeCompleto'],
        },
      ],
    });

    res.status(201).json(formatarRespostaComissao(comissaoCompleta));
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: 'Erro ao criar comissão.',
      errorDetails: error.message,
    });
  }
};

// Listar todas as comissões
export const getAllComissoes = async (req, res) => {
  try {
    const comissoes = await db.Comissao.findAll({
      include: [
        {
          model: db.LodgeMember,
          as: 'membros',
          attributes: ['id', 'NomeCompleto'],
          through: { attributes: [] },
        },
        {
          model: db.LodgeMember,
          as: 'presidente',
          attributes: ['id', 'NomeCompleto'],
        },
      ],
      order: [['nome', 'ASC']],
    });

    const comissoesFormatadas = comissoes.map(formatarRespostaComissao);
    res.status(200).json(comissoesFormatadas);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao listar comissões.',
      errorDetails: error.message,
    });
  }
};

// Obter detalhes de uma comissão
export const getComissaoById = async (req, res) => {
  try {
    const comissao = await db.Comissao.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: 'membros',
          attributes: ['id', 'NomeCompleto'],
          through: { attributes: [] },
        },
        {
          model: db.LodgeMember,
          as: 'presidente',
          attributes: ['id', 'NomeCompleto'],
        },
      ],
    });
    if (!comissao) {
      return res.status(404).json({ message: 'Comissão não encontrada.' });
    }
    res.status(200).json(formatarRespostaComissao(comissao));
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar comissão.',
      errorDetails: error.message,
    });
  }
};

// Atualizar uma comissão
export const updateComissao = async (req, res) => {
  const { presidenteId, membrosIds, ...dadosComissao } = req.body;
  const t = await db.sequelize.transaction();

  try {
    const comissao = await db.Comissao.findByPk(req.params.id);
    if (!comissao) {
      await t.rollback();
      return res.status(404).json({ message: 'Comissão não encontrada.' });
    }

    // 1. Validação
    if (!presidenteId) {
      await t.rollback();
      return res.status(400).json({ message: 'O presidente da comissão é obrigatório.' });
    }
    if (!membrosIds || membrosIds.length < 2) {
      await t.rollback();
      return res.status(400).json({ message: 'A comissão deve ter no mínimo 2 outros membros além do presidente.' });
    }
    if (membrosIds.includes(presidenteId)) {
      await t.rollback();
      return res.status(400).json({ message: 'O presidente não pode ser listado duas vezes.' });
    }

    // 2. Atualização dos Dados
    dadosComissao.presidenteId = presidenteId;
    await comissao.update(dadosComissao, { transaction: t });

    // 3. Sincronização dos Membros
    const todosMembrosIds = [presidenteId, ...membrosIds];
    await comissao.setMembros(todosMembrosIds, { transaction: t });

    await t.commit();

    // 4. Resposta Final
    const comissaoAtualizada = await db.Comissao.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: 'membros',
          attributes: ['id', 'NomeCompleto'],
          through: { attributes: [] },
        },
        {
          model: db.LodgeMember,
          as: 'presidente',
          attributes: ['id', 'NomeCompleto'],
        },
      ],
    });

    res.status(200).json(formatarRespostaComissao(comissaoAtualizada));
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: 'Erro ao atualizar comissão.',
      errorDetails: error.message,
    });
  }
};

// Deletar uma comissão
export const deleteComissao = async (req, res) => {
  try {
    const comissao = await db.Comissao.findByPk(req.params.id);
    if (!comissao) {
      return res.status(404).json({ message: "Comissão não encontrada." });
    }

    // A restrição da FK (ON DELETE RESTRICT) no `presidenteId` impedirá a exclusão
    // se o presidente ainda estiver vinculado. No entanto, as associações em `MembroComissao`
    // precisam ser removidas manualmente antes.
    const t = await db.sequelize.transaction();
    try {
      await comissao.setMembros([], { transaction: t }); // Remove todas as associações
      await comissao.destroy({ transaction: t });
      await t.commit();
      res.status(204).send();
    } catch (error) {
      await t.rollback();
      // Verifica se o erro é por causa da restrição do presidente
      if (error instanceof Sequelize.ForeignKeyConstraintError) {
        return res.status(409).json({
          message: "Não é possível deletar a comissão.",
          errorDetails: "A comissão tem um presidente associado que não pode ser removido automaticamente.",
        });
      }
      throw error; // Lança outros erros
    }
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar comissão.",
      errorDetails: error.message,
    });
  }
};