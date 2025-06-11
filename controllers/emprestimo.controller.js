// controllers/emprestimo.controller.js
import db from '../models/index.js';

// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Registrar um novo empréstimo (check-out)
export const registrarEmprestimo = async (req, res) => {
  const { livroId, membroId, dataDevolucaoPrevista } = req.body;
  const t = await db.sequelize.transaction();
  try {
    const livro = await db.Biblioteca.findByPk(livroId, { transaction: t }); // Usa db.Biblioteca
    if (!livro) {
      await t.rollback();
      return res.status(404).json({ message: 'Livro não encontrado.' });
    }
    if (livro.status !== 'Disponível') {
      await t.rollback();
      return res.status(409).json({ message: `O livro "${livro.titulo}" não está disponível para empréstimo.` });
    }
    const novoEmprestimo = await db.Emprestimo.create({ // Usa db.Emprestimo
      livroId, membroId, dataDevolucaoPrevista
    }, { transaction: t });

    await t.commit();
    res.status(201).json(novoEmprestimo);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Erro ao registrar empréstimo.', errorDetails: error.message });
  }
};

// Registrar uma devolução (check-in)
export const registrarDevolucao = async (req, res) => {
  const { emprestimoId } = req.params;
  const t = await db.sequelize.transaction();
  try {
    const emprestimo = await db.Emprestimo.findByPk(emprestimoId, { transaction: t }); // Usa db.Emprestimo
    if (!emprestimo) {
      await t.rollback();
      return res.status(404).json({ message: 'Registro de empréstimo não encontrado.' });
    }
    if (emprestimo.dataDevolucaoReal) {
      await t.rollback();
      return res.status(409).json({ message: 'Este livro já foi devolvido.' });
    }
    emprestimo.dataDevolucaoReal = new Date();
    await emprestimo.save({ transaction: t });
    await t.commit();
    res.status(200).json(emprestimo);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Erro ao registrar devolução.', errorDetails: error.message });
  }
};

// Listar todos os empréstimos (com filtros)
export const listarTodosEmprestimos = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};

    if (status === 'Emprestado') whereClause.dataDevolucaoReal = null;
    if (status === 'Devolvido') whereClause.dataDevolucaoReal = { [db.Sequelize.Op.ne]: null };

    const emprestimos = await db.Emprestimo.findAll({ // Usa db.Emprestimo
      where: whereClause,
      include: [
        { model: db.Biblioteca, as: 'livro', attributes: ['id', 'titulo'] }, // Usa db.Biblioteca
        { model: db.LodgeMember, as: 'membro', attributes: ['id', 'NomeCompleto'] } // Usa db.LodgeMember
      ],
      order: [['dataEmprestimo', 'DESC']],
    });

    if (status === 'Atrasado') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const atrasados = emprestimos.filter(e => e.dataDevolucaoReal === null && new Date(e.dataDevolucaoPrevista) < hoje);
        return res.status(200).json(atrasados);
    }

    res.status(200).json(emprestimos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar empréstimos.', errorDetails: error.message });
  }
};

// Listar empréstimos de um membro específico
export const listarEmprestimosDoMembro = async (req, res) => {
  try {
    const { membroId } = req.params;
    const emprestimos = await db.Emprestimo.findAll({ // Usa db.Emprestimo
      where: { membroId },
      include: [{ model: db.Biblioteca, as: 'livro', attributes: ['id', 'titulo', 'status'] }], // Usa db.Biblioteca
      order: [['dataEmprestimo', 'DESC']],
    });
    res.status(200).json(emprestimos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar empréstimos do membro.', errorDetails: error.message });
  }
};
