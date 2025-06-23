// controllers/arquivoDiverso.controller.js
import db from "../models/index.js";
import fs from "fs";
import path from "path";

const removerArquivoFisico = (caminhoRelativo) => {
  if (!caminhoRelativo) return;
  const caminhoAbsoluto = path.resolve(caminhoRelativo);
  fs.unlink(caminhoAbsoluto, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`Erro ao deletar arquivo físico ${caminhoAbsoluto}:`, err);
    }
  });
};

export const createArquivoDiverso = async (req, res) => {
  try {
    const { titulo, descricao, dataPublicacao } = req.body;
    const lodgeMemberId = req.user.id;
    if (!req.file)
      return res
        .status(400)
        .json({ message: "O envio do arquivo é obrigatório." });

    const caminhoRelativo = path
      .join("uploads", "arquivos_diversos", req.file.filename)
      .replace(/\\/g, "/");

    const novoArquivo = await db.ArquivoDiverso.create({
      titulo,
      descricao,
      dataPublicacao,
      lodgeMemberId,
      caminhoArquivo: caminhoRelativo,
      nomeOriginalArquivo: req.file.originalname,
    });
    res
      .status(201)
      .json({ message: "Arquivo criado com sucesso!", data: novoArquivo });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao criar arquivo:", error);
    res.status(500).json({
      message: "Erro interno ao criar arquivo.",
      errorDetails: error.message,
    });
  }
};

export const getAllArquivosDiversos = async (req, res) => {
  try {
    const arquivos = await db.ArquivoDiverso.findAll({
      order: [["dataPublicacao", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });
    res.status(200).json(arquivos);
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    res.status(500).json({
      message: "Erro interno ao listar arquivos.",
      errorDetails: error.message,
    });
  }
};

export const getArquivoDiversoById = async (req, res) => {
  try {
    const arquivo = await db.ArquivoDiverso.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: "autor",
          attributes: ["id", "NomeCompleto"],
        },
      ],
    });
    if (!arquivo)
      return res.status(404).json({ message: "Arquivo não encontrado." });
    res.status(200).json(arquivo);
  } catch (error) {
    console.error("Erro ao buscar arquivo:", error);
    res.status(500).json({
      message: "Erro interno ao buscar arquivo.",
      errorDetails: error.message,
    });
  }
};

export const updateArquivoDiverso = async (req, res) => {
  try {
    const arquivo = await db.ArquivoDiverso.findByPk(req.params.id);
    if (!arquivo) {
      if (req.file) removerArquivoFisico(req.file.path);
      return res.status(404).json({ message: "Arquivo não encontrado." });
    }

    const caminhoArquivoAntigo = arquivo.caminhoArquivo;
    const { titulo, descricao, dataPublicacao } = req.body;

    arquivo.titulo = titulo;
    arquivo.descricao = descricao;
    arquivo.dataPublicacao = dataPublicacao;

    // --- CORREÇÃO APLICADA AQUI ---
    if (req.file) {
      // Constrói o caminho relativo para o novo arquivo, igual à função de create
      const caminhoRelativo = path
        .join("uploads", "arquivos_diversos", req.file.filename)
        .replace(/\\/g, "/");

      arquivo.caminhoArquivo = caminhoRelativo; // <-- Salvando o caminho relativo
      arquivo.nomeOriginalArquivo = req.file.originalname;
      removerArquivoFisico(caminhoArquivoAntigo);
    }

    await arquivo.save();
    res
      .status(200)
      .json({ message: "Arquivo atualizado com sucesso!", data: arquivo });
  } catch (error) {
    if (req.file) removerArquivoFisico(req.file.path);
    console.error("Erro ao atualizar arquivo:", error);
    res.status(500).json({
      message: "Erro interno ao atualizar arquivo.",
      errorDetails: error.message,
    });
  }
};

export const deleteArquivoDiverso = async (req, res) => {
  try {
    const arquivo = await db.ArquivoDiverso.findByPk(req.params.id);
    if (!arquivo)
      return res.status(404).json({ message: "Arquivo não encontrado." });

    removerArquivoFisico(arquivo.caminhoArquivo);
    await arquivo.destroy();

    res.status(200).json({ message: "Arquivo deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    res.status(500).json({
      message: "Erro interno ao deletar arquivo.",
      errorDetails: error.message,
    });
  }
};
