// backend/controllers/publicacao.controller.js
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para remover arquivo
const removeFile = (filePath) => {
  if (!filePath) return;
  // Assumindo que 'uploads' está na raiz do projeto e o path salvo é relativo a 'uploads/'
  // Ex: 'publicacoes/arquivo.pdf'
  const fullPath = path.resolve(__dirname, '../../uploads/', filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Arquivo de publicação removido: ${fullPath}`);
    } catch (err) {
      console.error(`Erro ao remover arquivo de publicação ${fullPath}:`, err);
    }
  }
};

// Criar uma nova Publicação
export const createPublicacao = async (req, res) => {
  try {
    const { data, tema, nome, grau } = req.body;
    const lodgeMemberId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo da publicação é obrigatório.' });
    }

    // Salva o path relativo à pasta 'uploads/', ex: 'publicacoes/nomearquivo.pdf'
    const filePath = req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length);

    if (!db.Publicacao) {
        console.error("[createPublicacao] Modelo Publicacao não disponível em db.");
        return res.status(500).json({ message: "Erro interno: Modelo Publicacao não inicializado." });
    }

    const novaPublicacao = await db.Publicacao.create({
      data: data || new Date(),
      tema,
      nome,
      grau: grau || null,
      path: filePath,
      lodgeMemberId,
    });
    res.status(201).json(novaPublicacao);
  } catch (error) {
    console.error('Erro ao criar publicação:', error);
    if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao criar publicação.', errorDetails: error.message });
  }
};

// Listar todas as Publicações
export const getAllPublicacoes = async (req, res) => {
  try {
    const { tema, nome, grau } = req.query;
    if (!db.Publicacao || !db.LodgeMember) {
        console.error("[getAllPublicacoes] Modelos Publicacao ou LodgeMember não disponíveis em db.");
        return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }

    const whereClause = {};
    if (tema) whereClause.tema = { [db.Sequelize.Op.like]: `%${tema}%` };
    if (nome) whereClause.nome = { [db.Sequelize.Op.like]: `%${nome}%` };
    if (grau) whereClause.grau = grau;

    const publicacoes = await db.Publicacao.findAll({
      where: whereClause,
      include: [{ model: db.LodgeMember, as: 'autorOuUploader', attributes: ['id', 'NomeCompleto'], required: false }],
      order: [['data', 'DESC'], ['nome', 'ASC']],
    });
    res.status(200).json(publicacoes);
  } catch (error) {
    console.error('Erro ao buscar publicações:', error);
    res.status(500).json({ message: 'Erro ao buscar publicações.', errorDetails: error.message });
  }
};

// Obter uma Publicação por ID
export const getPublicacaoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Publicacao || !db.LodgeMember) {
        console.error("[getPublicacaoById] Modelos Publicacao ou LodgeMember não disponíveis em db.");
        return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }
    const publicacao = await db.Publicacao.findByPk(id, {
      include: [{ model: db.LodgeMember, as: 'autorOuUploader', attributes: ['id', 'NomeCompleto'], required: false }],
    });
    if (!publicacao) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }
    res.status(200).json(publicacao);
  } catch (error) {
    console.error('Erro ao buscar publicação por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar publicação por ID.', errorDetails: error.message });
  }
};

// Atualizar uma Publicação
export const updatePublicacao = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Publicacao) {
        console.error("[updatePublicacao] Modelo Publicacao não disponível em db.");
        return res.status(500).json({ message: "Erro interno: Modelo Publicacao não inicializado." });
    }
    const publicacaoExistente = await db.Publicacao.findByPk(id);

    if (!publicacaoExistente) {
      if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
      }
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    const dadosAtualizados = { ...req.body };
    delete dadosAtualizados.id;

    let oldFilePath = publicacaoExistente.path;

    if (req.file) {
      if (oldFilePath) {
        removeFile(oldFilePath);
      }
      dadosAtualizados.path = req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length);
    }

    await publicacaoExistente.update(dadosAtualizados);
    const publicacaoAtualizada = await db.Publicacao.findByPk(id, {
        include: [{ model: db.LodgeMember, as: 'autorOuUploader', attributes: ['id', 'NomeCompleto'], required: false }]
    });
    res.status(200).json(publicacaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar publicação:', error);
    if (req.file && req.file.path) {
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao atualizar publicação.', errorDetails: error.message });
  }
};

// Deletar uma Publicação
export const deletePublicacao = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Publicacao) {
        console.error("[deletePublicacao] Modelo Publicacao não disponível em db.");
        return res.status(500).json({ message: "Erro interno: Modelo Publicacao não inicializado." });
    }
    const publicacao = await db.Publicacao.findByPk(id);

    if (!publicacao) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    if (publicacao.path) {
      removeFile(publicacao.path);
    }
    await publicacao.destroy();
    res.status(200).json({ message: 'Publicação deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar publicação:', error);
    res.status(500).json({ message: 'Erro ao deletar publicação.', errorDetails: error.message });
  }
};