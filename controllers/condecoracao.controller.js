// controllers/condecoracao.controller.js
import db from '../models/index.js';

const Condecoracao = db.Condecoracao;

// Adicionar uma condecoração para um membro
export const addCondecoracao = async (req, res) => {
  try {
    const { lodgeMemberId } = req.params;
    const condecoracaoData = { ...req.body, lodgeMemberId };
    const novaCondecoracao = await Condecoracao.create(condecoracaoData);
    res.status(201).json(novaCondecoracao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar condecoração.', errorDetails: error.message });
  }
};

// Listar todas as condecorações de um membro
export const getCondecoracoesByLodgeMember = async (req, res) => {
  try {
    const { lodgeMemberId } = req.params;
    const condecoracoes = await Condecoracao.findAll({
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
    const [updated] = await Condecoracao.update(req.body, { where: { id: condecoracaoId } });
    if (!updated) {
      return res.status(404).json({ message: 'Condecoração não encontrada.' });
    }
    const updatedCondecoracao = await Condecoracao.findByPk(condecoracaoId);
    res.status(200).json(updatedCondecoracao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar condecoração.', errorDetails: error.message });
  }
};

// Deletar uma condecoração específica
export const deleteCondecoracao = async (req, res) => {
  try {
    const { condecoracaoId } = req.params;
    const deleted = await Condecoracao.destroy({ where: { id: condecoracaoId } });
    if (!deleted) {
      return res.status(404).json({ message: 'Condecoração não encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar condecoração.', errorDetails: error.message });
  }
};