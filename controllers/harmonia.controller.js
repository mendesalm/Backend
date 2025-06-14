// backend/controllers/harmonia.controller.js
import db from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para remover arquivo, se existir e se for um path local
const removeFile = (filePath) => {
  if (
    !filePath ||
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    // Não tenta remover URLs
    return;
  }
  // Assumindo que 'uploads' está na raiz do projeto, e este controller está em 'backend/controllers'
  const fullPath = path.resolve(
    __dirname,
    "../../uploads/",
    filePath.substring(filePath.indexOf("harmonia/"))
  ); // Ajuste se a estrutura de path salva for diferente
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Arquivo removido: ${fullPath}`);
    } catch (err) {
      console.error(`Erro ao remover arquivo ${fullPath}:`, err);
    }
  } else {
    // console.warn(`Arquivo não encontrado para remoção: ${fullPath}`);
  }
};

// Criar um novo item de harmonia
export const createItemHarmonia = async (req, res) => {
  try {
    const { categoria, subcategoria, titulo, autor } = req.body;
    const lodgeMemberId = req.user.id; // Usuário logado que está cadastrando
    let filePath = req.body.path || null; // Permite que um link seja enviado no corpo

    if (req.file) {
      // Se um arquivo foi upado via multer
      // O path salvo pelo multer já é relativo à pasta 'uploads', ex: 'uploads/harmonia/arquivo.mp3'
      // Precisamos salvar um path que possa ser servido estaticamente ou identificado.
      // Se o multer salva em 'backend/uploads/harmonia/arquivo.mp3', e '/uploads' é servido estaticamente
      // a partir de 'backend/uploads', então o path a ser salvo seria 'harmonia/arquivo.mp3'
      filePath = req.file.path
        .replace(/\\/g, "/")
        .substring(
          req.file.path.replace(/\\/g, "/").indexOf("uploads/") +
            "uploads/".length
        );
    }

    if (!db.Harmonia) {
      console.error(
        "[createItemHarmonia] Modelo Harmonia não disponível em db."
      );
      return res
        .status(500)
        .json({ message: "Erro interno: Modelo Harmonia não inicializado." });
    }

    const novoItem = await db.Harmonia.create({
      categoria: categoria || null,
      subcategoria: subcategoria || null,
      titulo,
      autor: autor || null,
      path: filePath,
      lodgeMemberId,
    });
    res.status(201).json(novoItem);
  } catch (error) {
    console.error("Erro ao criar item de harmonia:", error);
    if (req.file && req.file.path) {
      // Usa o path original do multer para remoção em caso de erro
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
      .json({
        message: "Erro ao criar item de harmonia",
        errorDetails: error.message,
      });
  }
};

// Obter todos os itens de harmonia (com filtro opcional por categoria/subcategoria)
export const getAllItensHarmonia = async (req, res) => {
  try {
    const { categoria, subcategoria, titulo, autor } = req.query;

    if (!db.Harmonia || !db.LodgeMember) {
      console.error(
        "[getAllItensHarmonia] Modelo Harmonia ou LodgeMember não disponível em db."
      );
      return res
        .status(500)
        .json({ message: "Erro interno: Modelos não inicializados." });
    }

    const whereClause = {};
    if (categoria)
      whereClause.categoria = { [db.Sequelize.Op.like]: `%${categoria}%` };
    if (subcategoria)
      whereClause.subcategoria = {
        [db.Sequelize.Op.like]: `%${subcategoria}%`,
      };
    if (titulo) whereClause.titulo = { [db.Sequelize.Op.like]: `%${titulo}%` };
    if (autor) whereClause.autor = { [db.Sequelize.Op.like]: `%${autor}%` };

    const itens = await db.Harmonia.findAll({
      where: whereClause,
      include: [
        {
          model: db.LodgeMember,
          as: "cadastradoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
      ],
      order: [["titulo", "ASC"]],
    });
    res.status(200).json(itens);
  } catch (error) {
    console.error("Erro ao buscar itens de harmonia:", error);
    res
      .status(500)
      .json({
        message: "Erro ao buscar itens de harmonia",
        errorDetails: error.message,
      });
  }
};

// Obter um item de harmonia pelo ID
export const getItemHarmoniaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Harmonia || !db.LodgeMember) {
      console.error(
        "[getItemHarmoniaById] Modelo Harmonia ou LodgeMember não disponível em db."
      );
      return res
        .status(500)
        .json({ message: "Erro interno: Modelos não inicializados." });
    }
    const item = await db.Harmonia.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "cadastradoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
      ],
    });
    if (!item) {
      return res
        .status(404)
        .json({ message: "Item de harmonia não encontrado" });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error("Erro ao buscar item de harmonia por ID:", error);
    res
      .status(500)
      .json({
        message: "Erro ao buscar item de harmonia por ID",
        errorDetails: error.message,
      });
  }
};

// Atualizar um item de harmonia
export const updateItemHarmonia = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Harmonia) {
      console.error(
        "[updateItemHarmonia] Modelo Harmonia não disponível em db."
      );
      return res
        .status(500)
        .json({ message: "Erro interno: Modelo Harmonia não inicializado." });
    }
    const itemExistente = await db.Harmonia.findByPk(id);

    if (!itemExistente) {
      if (req.file && req.file.path) {
        // Se um arquivo foi enviado para um item inexistente
        const multerPath = path.resolve(__dirname, "../../", req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
      }
      return res
        .status(404)
        .json({ message: "Item de harmonia não encontrado" });
    }

    const dadosAtualizados = { ...req.body };
    delete dadosAtualizados.id;
    delete dadosAtualizados.lodgeMemberId; // Não permitir alteração de quem cadastrou

    let oldFilePath = itemExistente.path;

    if (req.file) {
      // Novo arquivo enviado
      if (
        oldFilePath &&
        !(
          oldFilePath.startsWith("http://") ||
          oldFilePath.startsWith("https://")
        )
      ) {
        removeFile(oldFilePath); // Remove o arquivo antigo se não for URL
      }
      dadosAtualizados.path = req.file.path
        .replace(/\\/g, "/")
        .substring(
          req.file.path.replace(/\\/g, "/").indexOf("uploads/") +
            "uploads/".length
        );
    } else if (dadosAtualizados.hasOwnProperty("path")) {
      // Path foi enviado no corpo (pode ser uma URL, ou string vazia/null para remover)
      if (
        (dadosAtualizados.path === "" || dadosAtualizados.path === null) &&
        oldFilePath &&
        !(
          oldFilePath.startsWith("http://") ||
          oldFilePath.startsWith("https://")
        )
      ) {
        removeFile(oldFilePath); // Remove arquivo antigo se o novo path é para limpar
        dadosAtualizados.path = null;
      }
      // Se dadosAtualizados.path é uma URL, ela simplesmente substitui oldFilePath.
      // Se dadosAtualizados.path não foi enviado, o path existente não é alterado.
    }

    await itemExistente.update(dadosAtualizados);
    const itemAtualizado = await db.Harmonia.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "cadastradoPor",
          attributes: ["id", "NomeCompleto"],
          required: false,
        },
      ],
    });
    res.status(200).json(itemAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar item de harmonia:", error);
    // Se um arquivo foi upado mas a atualização do DB falhou, remove o arquivo novo.
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
      .json({
        message: "Erro ao atualizar item de harmonia",
        errorDetails: error.message,
      });
  }
};

// Deletar um item de harmonia
export const deleteItemHarmonia = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Harmonia) {
      console.error(
        "[deleteItemHarmonia] Modelo Harmonia não disponível em db."
      );
      return res
        .status(500)
        .json({ message: "Erro interno: Modelo Harmonia não inicializado." });
    }
    const item = await db.Harmonia.findByPk(id);

    if (!item) {
      return res
        .status(404)
        .json({ message: "Item de harmonia não encontrado" });
    }

    if (
      item.path &&
      !(item.path.startsWith("http://") || item.path.startsWith("https://"))
    ) {
      removeFile(item.path);
    }
    await item.destroy();
    res.status(200).json({ message: "Item de harmonia deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar item de harmonia:", error);
    res
      .status(500)
      .json({
        message: "Erro ao deletar item de harmonia",
        errorDetails: error.message,
      });
  }
};
