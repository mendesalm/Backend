// backend/controllers/biblioteca.controller.js
import db from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORREÇÃO: Removida a constante 'Livro' do escopo global do módulo.
// const Livro = db.Biblioteca;

// Função para remover arquivo, se existir e se for um path local
const removeFile = (filePath) => {
  if (
    !filePath ||
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return;
  }
  const fullPath = path.resolve(
    __dirname,
    "../../uploads/",
    filePath.substring(filePath.indexOf("biblioteca/"))
  );
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
      titulo,
      autores,
      editora,
      anoPublicacao,
      ISBN,
      numeroPaginas,
      classificacao,
      observacoes,
    } = req.body;

    const lodgeMemberId = req.user.id;
    let filePath = null;
    if (req.file) {
      filePath = req.file.path
        .replace(/\\/g, "/")
        .substring(
          req.file.path.replace(/\\/g, "/").indexOf("uploads/") +
            "uploads/".length
        );
    }

    // CORREÇÃO: Usar db.Biblioteca diretamente
    const novoLivro = await db.Biblioteca.create({
      titulo,
      autores,
      editora,
      anoPublicacao: anoPublicacao ? parseInt(anoPublicacao, 10) : null,
      ISBN,
      numeroPaginas: numeroPaginas ? parseInt(numeroPaginas, 10) : null,
      classificacao,
      observacoes,
      path: filePath,
      status: "Disponível",
      lodgeMemberId,
    });

    res.status(201).json(novoLivro);
  } catch (error) {
    console.error("Erro ao criar livro:", error);
    if (req.file && req.file.path) {
      const multerPath = path.resolve(__dirname, "../../", req.file.path);
      if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({ message: "Erro ao criar livro", error: error.message });
  }
};

// Obter todos os livros
export const getAllLivros = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "titulo",
      order = "ASC",
      search,
      status,
    } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      const { Op } = db.Sequelize;
      whereClause[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { autores: { [Op.like]: `%${search}%` } },
        { ISBN: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.Biblioteca.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.LodgeMember,
          as: "cadastradoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
      ],
      limit: parseInt(limit, 10),
      offset,
      order: [[sortBy, order.toUpperCase()]],
    });

    res.status(200).json({
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    res
      .status(500)
      .json({ message: "Erro ao buscar livros", error: error.message });
  }
};

// Obter um livro pelo ID, incluindo o histórico de empréstimos
export const getLivroById = async (req, res) => {
  try {
    const { id } = req.params;
    // CORREÇÃO: Usar os modelos a partir do objeto `db`
    const livro = await db.Biblioteca.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "cadastradoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
        {
          model: db.Emprestimo,
          as: "historicoEmprestimos",
          required: false,
          include: [
            {
              model: db.LodgeMember,
              as: "membro",
              attributes: ["id", "NomeCompleto"],
            },
          ],
          order: [["dataEmprestimo", "DESC"]],
        },
      ],
    });

    if (!livro) {
      return res.status(404).json({ message: "Livro não encontrado" });
    }
    res.status(200).json(livro);
  } catch (error) {
    console.error("Erro ao buscar livro por ID:", error);
    res
      .status(500)
      .json({ message: "Erro ao buscar livro por ID", error: error.message });
  }
};

// Atualizar um livro
export const updateLivro = async (req, res) => {
  try {
    const { id } = req.params;
    // CORREÇÃO: Usar db.Biblioteca
    const livroExistente = await db.Biblioteca.findByPk(id);

    if (!livroExistente) {
      if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, "../../", req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
      }
      return res.status(404).json({ message: "Livro não encontrado" });
    }

    const dadosAtualizados = { ...req.body };
    delete dadosAtualizados.id;
    delete dadosAtualizados.lodgeMemberId;
    delete dadosAtualizados.status;

    let oldFilePath = livroExistente.path;
    if (req.file) {
      if (oldFilePath) removeFile(oldFilePath);
      dadosAtualizados.path = req.file.path
        .replace(/\\/g, "/")
        .substring(
          req.file.path.replace(/\\/g, "/").indexOf("uploads/") +
            "uploads/".length
        );
    }

    await livroExistente.update(dadosAtualizados);
    const livroAtualizado = await db.Biblioteca.findByPk(id); // CORREÇÃO
    res.status(200).json(livroAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar livro:", error);
    if (req.file && req.file.path) {
      const multerPath = path.resolve(__dirname, "../../", req.file.path);
      if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({ message: "Erro ao atualizar livro", error: error.message });
  }
};

// Deletar um livro, verificando se não está emprestado
export const deleteLivro = async (req, res) => {
  try {
    const { id } = req.params;
    // CORREÇÃO: Usar db.Biblioteca
    const livro = await db.Biblioteca.findByPk(id);

    if (!livro) {
      return res.status(404).json({ message: "Livro não encontrado" });
    }

    if (livro.status === "Emprestado") {
      return res.status(409).json({
        message: `Não é possível deletar o livro "${livro.titulo}" pois ele está atualmente emprestado.`,
      });
    }

    if (livro.path) {
      removeFile(livro.path);
    }

    await livro.destroy({ where: { id } });
    res.status(200).json({ message: "Livro deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar livro:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(409)
        .json({
          message:
            "Não é possível deletar este livro pois ele possui um histórico de empréstimos associado. Considere inativá-lo em vez de deletar.",
        });
    }
    res
      .status(500)
      .json({ message: "Erro ao deletar livro", errorDetails: error.message });
  }
};
