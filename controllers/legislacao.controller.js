import db from "../models/index.js";
import fs from "fs";
import path from "path";

// Helper para lidar com a exclusão de arquivos de forma segura
const removerArquivoFisico = (caminhoRelativo) => {
  if (!caminhoRelativo) return;
  const caminhoAbsoluto = path.resolve(caminhoRelativo);
  fs.unlink(caminhoAbsoluto, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`Erro ao deletar arquivo físico ${caminhoAbsoluto}:`, err);
    }
  });
};

/**
 * Cria uma nova legislação com upload de arquivo.
 */
export const createLegislacao = async (req, res) => {
  try {
    const { titulo, descricao, dataPublicacao } = req.body;
    const lodgeMemberId = req.user.id;
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "O envio do arquivo é obrigatório." });
    }

    const caminhoRelativo = path
      .join("uploads", "legislacoes", req.file.filename)
      .replace(/\\/g, "/");

    const novaLegislacao = await db.Legislacao.create({
      titulo,
      descricao,
      dataPublicacao,
      lodgeMemberId,
      caminhoArquivo: caminhoRelativo,
      nomeOriginalArquivo: req.file.originalname,
    });

    res
      .status(201)
      .json({
        message: "Legislação criada com sucesso!",
        data: novaLegislacao,
      });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao criar legislação:", error);
    res.status(500).json({
      message: "Erro interno ao criar legislação.",
      errorDetails: error.message,
    });
  }
};

/**
 * Lista todas as legislações.
 */
export const getAllLegislacoes = async (req, res) => {
  try {
    const legislacoes = await db.Legislacao.findAll({
      order: [["dataPublicacao", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });
    res.status(200).json(legislacoes);
  } catch (error) {
    console.error("Erro ao listar legislações:", error);
    res.status(500).json({
      message: "Erro interno ao listar legislações.",
      errorDetails: error.message,
    });
  }
};

/**
 * Busca uma legislação pelo ID.
 */
export const getLegislacaoById = async (req, res) => {
  try {
    const { id } = req.params;
    const legislacao = await db.Legislacao.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });

    if (!legislacao) {
      return res.status(404).json({ message: "Legislação não encontrada." });
    }
    res.status(200).json(legislacao);
  } catch (error) {
    console.error("Erro ao buscar legislação:", error);
    res.status(500).json({
      message: "Erro interno ao buscar legislação.",
      errorDetails: error.message,
    });
  }
};

/**
 * Atualiza uma legislação.
 */
export const updateLegislacao = async (req, res) => {
  try {
    const { id } = req.params;
    const legislacao = await db.Legislacao.findByPk(id);
    if (!legislacao) {
      if (req.file) removerArquivoFisico(req.file.path);
      return res.status(404).json({ message: "Legislação não encontrada." });
    }

    const caminhoArquivoAntigo = legislacao.caminhoArquivo;
    const { titulo, descricao, dataPublicacao } = req.body;

    legislacao.titulo = titulo;
    legislacao.descricao = descricao;
    legislacao.dataPublicacao = dataPublicacao;

    if (req.file) {
      const caminhoRelativo = path
        .join("uploads", "legislacoes", req.file.filename)
        .replace(/\\/g, "/");
      legislacao.caminhoArquivo = caminhoRelativo;
      legislacao.nomeOriginalArquivo = req.file.originalname;
      removerArquivoFisico(caminhoArquivoAntigo);
    }

    await legislacao.save();

    res
      .status(200)
      .json({
        message: "Legislação atualizada com sucesso!",
        data: legislacao,
      });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao atualizar legislação:", error);
    res.status(500).json({
      message: "Erro interno ao atualizar legislação.",
      errorDetails: error.message,
    });
  }
};

/**
 * Deleta uma legislação.
 */
export const deleteLegislacao = async (req, res) => {
  try {
    const { id } = req.params;
    const legislacao = await db.Legislacao.findByPk(id);

    if (!legislacao) {
      return res.status(404).json({ message: "Legislação não encontrada." });
    }

    removerArquivoFisico(legislacao.caminhoArquivo);
    await legislacao.destroy();

    res.status(200).json({ message: "Legislação deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar legislação:", error);
    res.status(500).json({
      message: "Erro interno ao deletar legislação.",
      errorDetails: error.message,
    });
  }
};
