// controllers/condecoracao.controller.js
import db from '../models/index.js';

// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Adicionar uma condecoração para um membro
export const addCondecoracao = async (req, res) => {
  try {
    const { lodgeMemberId } = req.params;
    const condecoracaoData = { ...req.body, lodgeMemberId };
    const novaCondecoracao = await db.Condecoracao.create(condecoracaoData); // Usa db.Condecoracao
    res.status(201).json(novaCondecoracao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar condecoração.', errorDetails: error.message });
  }
};

// Listar todas as condecorações de um membro
export const getCondecoracoesByLodgeMember = async (req, res) => {
  try {
    const { lodgeMemberId } = req.params;
    const condecoracoes = await db.Condecoracao.findAll({ // Usa db.Condecoracao
      where: { lodgeMemberId },
      order: [['dataRecebimento', 'DESC']],
    });
    res.status(200).json(condecoracoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar condecorações.', errorDetails: error.message });
  }
};

// Atualizar uma condecoração específica
export const updateCondecoracao = async (req, res) => {
  try {
    const { condecoracaoId } = req.params;
    const [updated] = await db.Condecoracao.update(req.body, { where: { id: condecoracaoId } }); // Usa db.Condecoracao
    if (!updated) {
      return res.status(404).json({ message: 'Condecoração não encontrada.' });
    }
    const updatedCondecoracao = await db.Condecoracao.findByPk(condecoracaoId); // Usa db.Condecoracao
    res.status(200).json(updatedCondecoracao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar condecoração.', errorDetails: error.message });
  }
};

// Deletar uma condecoração específica
export const deleteCondecoracao = async (req, res) => {
  try {
    const { condecoracaoId } = req.params;
    const deleted = await db.Condecoracao.destroy({ where: { id: condecoracaoId } }); // Usa db.Condecoracao
    if (!deleted) {
      return res.status(404).json({ message: 'Condecoração não encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar condecoração.', errorDetails: error.message });
  }
};
