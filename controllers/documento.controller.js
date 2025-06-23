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
 * Cria um novo documento com upload de arquivo.
 */
export const createDocumento = async (req, res) => {
  try {
    const { titulo, descricao, dataPublicacao } = req.body;
    const lodgeMemberId = req.user.id;
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "O envio do arquivo é obrigatório." });
    }

    const caminhoRelativo = path
      .join("uploads", "documentos", req.file.filename)
      .replace(/\\/g, "/");

    const novoDocumento = await db.Documento.create({
      titulo,
      descricao,
      dataPublicacao,
      lodgeMemberId,
      caminhoArquivo: caminhoRelativo,
      nomeOriginalArquivo: req.file.originalname,
    });

    res
      .status(201)
      .json({ message: "Documento criado com sucesso!", data: novoDocumento });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao criar documento:", error);
    res.status(500).json({
      message: "Erro interno ao criar documento.",
      errorDetails: error.message,
    });
  }
};

/**
 * Lista todos os documentos.
 */
export const getAllDocumentos = async (req, res) => {
  try {
    const documentos = await db.Documento.findAll({
      order: [["dataPublicacao", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });
    res.status(200).json(documentos);
  } catch (error) {
    console.error("Erro ao listar documentos:", error);
    res.status(500).json({
      message: "Erro interno ao listar documentos.",
      errorDetails: error.message,
    });
  }
};

/**
 * Busca um documento pelo ID.
 */
export const getDocumentoById = async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await db.Documento.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });

    if (!documento) {
      return res.status(404).json({ message: "Documento não encontrado." });
    }
    res.status(200).json(documento);
  } catch (error) {
    console.error("Erro ao buscar documento:", error);
    res.status(500).json({
      message: "Erro interno ao buscar documento.",
      errorDetails: error.message,
    });
  }
};

/**
 * Atualiza um documento.
 */
export const updateDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await db.Documento.findByPk(id);
    if (!documento) {
      if (req.file) removerArquivoFisico(req.file.path);
      return res.status(404).json({ message: "Documento não encontrado." });
    }

    const caminhoArquivoAntigo = documento.caminhoArquivo;
    const { titulo, descricao, dataPublicacao } = req.body;

    documento.titulo = titulo;
    documento.descricao = descricao;
    documento.dataPublicacao = dataPublicacao;

    if (req.file) {
      const caminhoRelativo = path
        .join("uploads", "documentos", req.file.filename)
        .replace(/\\/g, "/");
      documento.caminhoArquivo = caminhoRelativo;
      documento.nomeOriginalArquivo = req.file.originalname;
      removerArquivoFisico(caminhoArquivoAntigo);
    }

    await documento.save();

    res
      .status(200)
      .json({ message: "Documento atualizado com sucesso!", data: documento });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao atualizar documento:", error);
    res.status(500).json({
      message: "Erro interno ao atualizar documento.",
      errorDetails: error.message,
    });
  }
};

/**
 * Deleta um documento.
 */
export const deleteDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await db.Documento.findByPk(id);

    if (!documento) {
      return res.status(404).json({ message: "Documento não encontrado." });
    }

    removerArquivoFisico(documento.caminhoArquivo);
    await documento.destroy();

    res.status(200).json({ message: "Documento deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    res.status(500).json({
      message: "Erro interno ao deletar documento.",
      errorDetails: error.message,
    });
  }
};
