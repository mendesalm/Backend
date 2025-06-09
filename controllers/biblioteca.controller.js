// backend/controllers/biblioteca.controller.js
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Livro = db.Biblioteca; // Usando o nome do modelo 'Biblioteca' como 'Livro' para clareza

// Função para remover arquivo, se existir e se for um path local
const removeFile = (filePath) => {
  if (!filePath || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return;
  }
  const fullPath = path.resolve(__dirname, '../../uploads/', filePath.substring(filePath.indexOf('biblioteca/')));
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Arquivo de capa removido: ${fullPath}`);
    } catch (err) {
      console.error(`Erro ao remover arquivo de capa ${fullPath}:`, err);
    }
  }
};

// Criar um novo livro
export const createLivro = async (req, res) => {
  try {
    const {
      titulo, autores, editora, anoPublicacao, ISBN, numeroPaginas, classificacao, observacoes
    } = req.body;

    const lodgeMemberId = req.user.id;
    let filePath = null;
    if (req.file) {
      filePath = req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length);
    }

    const novoLivro = await Livro.create({
      titulo,
      autores,
      editora,
      anoPublicacao: anoPublicacao ? parseInt(anoPublicacao, 10) : null,
      ISBN,
      numeroPaginas: numeroPaginas ? parseInt(numeroPaginas, 10) : null,
      classificacao,
      observacoes,
      path: filePath,
      status: 'Disponível', // Novo livro sempre começa como 'Disponível'
      lodgeMemberId,
    });

    res.status(201).json(novoLivro);
  } catch (error) {
    console.error('Erro ao criar livro:', error);
    if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao criar livro', error: error.message });
  }
};

// Obter todos os livros
export const getAllLivros = async (req, res) => {
  try {
    const livros = await Livro.findAll({
      include: [{ model: db.LodgeMember, as: 'cadastradoPor', attributes: ['id', 'NomeCompleto'], required: false }],
      order: [['titulo', 'ASC']],
    });
    res.status(200).json(livros);
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    res.status(500).json({ message: 'Erro ao buscar livros', error: error.message });
  }
};

// Obter um livro pelo ID, incluindo o histórico de empréstimos
export const getLivroById = async (req, res) => {
  try {
    const { id } = req.params;
    const livro = await Livro.findByPk(id, {
      include: [
        { model: db.LodgeMember, as: 'cadastradoPor', attributes: ['id', 'NomeCompleto'], required: false },
        // --- ALTERAÇÃO: INCLUSÃO DO HISTÓRICO DE EMPRÉSTIMOS ---
        {
          model: db.Emprestimo,
          as: 'historicoEmprestimos',
          required: false, // `required: false` para trazer o livro mesmo que nunca tenha sido emprestado
          include: [{ model: db.LodgeMember, as: 'membro', attributes: ['id', 'NomeCompleto'] }],
          order: [['dataEmprestimo', 'DESC']] // Ordena o histórico do mais recente para o mais antigo
        }
      ]
    });

    if (!livro) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    res.status(200).json(livro);
  } catch (error) {
    console.error('Erro ao buscar livro por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar livro por ID', error: error.message });
  }
};

// Atualizar um livro
export const updateLivro = async (req, res) => {
  try {
    const { id } = req.params;
    const livroExistente = await Livro.findByPk(id);

    if (!livroExistente) {
      if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
      }
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    const dadosAtualizados = { ...req.body };
    delete dadosAtualizados.id;
    delete dadosAtualizados.lodgeMemberId;
    // O status é gerenciado pelos hooks de Emprestimo, então não permitimos sua alteração direta aqui.
    delete dadosAtualizados.status;

    let oldFilePath = livroExistente.path;
    if (req.file) {
      if (oldFilePath) removeFile(oldFilePath);
      dadosAtualizados.path = req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length);
    }

    await livroExistente.update(dadosAtualizados);
    const livroAtualizado = await Livro.findByPk(id);
    res.status(200).json(livroAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao atualizar livro', error: error.message });
  }
};

// Deletar um livro, verificando se não está emprestado
export const deleteLivro = async (req, res) => {
  try {
    const { id } = req.params;
    const livro = await Livro.findByPk(id);

    if (!livro) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    // --- ALTERAÇÃO: VERIFICAÇÃO DE STATUS ANTES DE DELETAR ---
    if (livro.status === 'Emprestado') {
      return res.status(409).json({ // 409 Conflict é um bom status para este caso
        message: `Não é possível deletar o livro "${livro.titulo}" pois ele está atualmente emprestado.`
      });
    }

    // Remover arquivo de capa associado, se existir
    if (livro.path) {
      removeFile(livro.path);
    }

    // Se o livro não está emprestado, pode ser deletado.
    // A migração de Emprestimos com `onDelete: 'RESTRICT'` na FK `livroId` oferece uma
    // camada extra de proteção no nível do banco de dados, impedindo a deleção
    // de um livro que tenha qualquer histórico de empréstimo.
    await livro.destroy({ where: { id } });
    res.status(200).json({ message: 'Livro deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
         return res.status(409).json({ message: 'Não é possível deletar este livro pois ele possui um histórico de empréstimos associado. Considere inativá-lo em vez de deletar.' });
    }
    res.status(500).json({ message: 'Erro ao deletar livro', errorDetails: error.message });
  }
};