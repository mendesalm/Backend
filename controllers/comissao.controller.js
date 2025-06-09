// controllers/comissao.controller.js
import db from '../models/index.js';

const Comissao = db.Comissao;
const CargoExercido = db.CargoExercido;
const LodgeMember = db.LodgeMember;

// Função para verificar se algum dos membros propostos é o Orador ativo
const verificarOrador = async (membrosIds) => {
  const oradorCargo = await CargoExercido.findOne({
    where: { nomeCargo: 'Orador', dataFim: null },
    attributes: ['lodgeMemberId'],
  });
  if (oradorCargo && membrosIds.includes(oradorCargo.lodgeMemberId)) {
    return true; // Encontrou o Orador na lista
  }
  return false;
};

// Criar uma nova comissão
export const createComissao = async (req, res) => {
  const { nome, descricao, tipo, dataInicio, dataFim, membrosIds } = req.body;
  const t = await db.sequelize.transaction();
  try {
    // Regra de negócio: Mínimo de 3 membros
    if (!membrosIds || membrosIds.length < 3) {
      return res.status(400).json({ message: 'A comissão deve ter no mínimo 3 membros.' });
    }
    // Regra de negócio: Orador não pode participar
    if (await verificarOrador(membrosIds)) {
      return res.status(400).json({ message: 'O Orador ativo não pode fazer parte de comissões.' });
    }

    const novaComissao = await Comissao.create({
      nome, descricao, tipo, dataInicio, dataFim, criadorId: req.user.id
    }, { transaction: t });

    await novaComissao.setMembros(membrosIds, { transaction: t });
    
    await t.commit();
    
    const comissaoCompleta = await Comissao.findByPk(novaComissao.id, {
        include: [{ model: LodgeMember, as: 'membros', attributes: ['id', 'NomeCompleto'], through: { attributes: [] } }]
    });

    res.status(201).json(comissaoCompleta);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Erro ao criar comissão.', errorDetails: error.message });
  }
};

// Listar todas as comissões
export const getAllComissoes = async (req, res) => {
    try {
        const comissoes = await Comissao.findAll({
            include: [
                { model: LodgeMember, as: 'membros', attributes: ['id', 'NomeCompleto'], through: { attributes: [] } },
                { model: LodgeMember, as: 'criador', attributes: ['id', 'NomeCompleto'] }
            ],
            order: [['nome', 'ASC']]
        });
        res.status(200).json(comissoes);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar comissões.', errorDetails: error.message });
    }
};

// Obter detalhes de uma comissão
export const getComissaoById = async (req, res) => {
    try {
        const comissao = await Comissao.findByPk(req.params.id, {
            include: [
                { model: LodgeMember, as: 'membros', attributes: ['id', 'NomeCompleto'], through: { attributes: [] } },
                { model: LodgeMember, as: 'criador', attributes: ['id', 'NomeCompleto'] }
            ]
        });
        if (!comissao) {
            return res.status(404).json({ message: 'Comissão não encontrada.' });
        }
        res.status(200).json(comissao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar comissão.', errorDetails: error.message });
    }
};

// Atualizar uma comissão
export const updateComissao = async (req, res) => {
    const { membrosIds, ...dadosComissao } = req.body;
    const t = await db.sequelize.transaction();
    try {
        const comissao = await Comissao.findByPk(req.params.id);
        if (!comissao) {
            await t.rollback();
            return res.status(404).json({ message: 'Comissão não encontrada.' });
        }
        
        if (membrosIds) {
            if (membrosIds.length < 3) {
                await t.rollback();
                return res.status(400).json({ message: 'A comissão deve ter no mínimo 3 membros.' });
            }
            if (await verificarOrador(membrosIds)) {
                await t.rollback();
                return res.status(400).json({ message: 'O Orador ativo não pode fazer parte de comissões.' });
            }
            await comissao.setMembros(membrosIds, { transaction: t });
        }
        
        await comissao.update(dadosComissao, { transaction: t });
        await t.commit();
        
        const comissaoAtualizada = await Comissao.findByPk(req.params.id, {
            include: [{ model: LodgeMember, as: 'membros', attributes: ['id', 'NomeCompleto'], through: { attributes: [] } }]
        });
        
        res.status(200).json(comissaoAtualizada);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Erro ao atualizar comissão.', errorDetails: error.message });
    }
};

// Deletar uma comissão
export const deleteComissao = async (req, res) => {
  try {
    const deleted = await Comissao.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Comissão não encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar comissão.', errorDetails: error.message });
  }
};