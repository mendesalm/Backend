// backend/controllers/ata.controller.js
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para remover arquivo, se existir e se for um path local
const removeFile = (filePath) => {
  if (!filePath || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return;
  }
  const fullPath = path.resolve(__dirname, '../../', filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Arquivo de ata removido: ${fullPath}`);
    } catch (err) {
      console.error(`Erro ao remover arquivo de ata ${fullPath}:`, err);
    }
  }
};

// Listar todas as Atas
export const getAllAtas = async (req, res) => {
  try {
    if (!db.Ata || !db.MasonicSession) {
        console.error("[getAllAtas] Modelos Ata ou MasonicSession não disponíveis em db.");
        return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }
    const atas = await db.Ata.findAll({
      include: [{
        model: db.MasonicSession,
        attributes: ['id', 'dataSessao', 'tipoSessao', 'subtipoSessao'], // Para dar contexto à ata
      }],
      order: [['ano', 'DESC'], ['numero', 'DESC']],
    });
    res.status(200).json(atas);
  } catch (error) {
    console.error('Erro ao buscar todas as atas:', error);
    res.status(500).json({ message: 'Erro ao buscar todas as atas.', errorDetails: error.message });
  }
};

// Obter uma Ata específica pelo ID
export const getAtaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Ata || !db.MasonicSession) {
        console.error("[getAtaById] Modelos Ata ou MasonicSession não disponíveis em db.");
        return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }
    const ata = await db.Ata.findByPk(id, {
      include: [{
        model: db.MasonicSession,
        attributes: ['id', 'dataSessao', 'tipoSessao', 'subtipoSessao'],
      }],
    });
    if (!ata) {
      return res.status(404).json({ message: 'Ata não encontrada.' });
    }
    res.status(200).json(ata);
  } catch (error) {
    console.error('Erro ao buscar ata por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar ata por ID.', errorDetails: error.message });
  }
};

// Atualizar metadados de uma Ata ou substituir o arquivo
export const updateAta = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, ano, dataDeAprovacao } = req.body;

    if (!db.Ata) {
        console.error("[updateAta] Modelo Ata não disponível em db.");
        return res.status(500).json({ message: "Erro interno: Modelo Ata não inicializado." });
    }

    const ataExistente = await db.Ata.findByPk(id);
    if (!ataExistente) {
      if (req.file && req.file.path) { // Se um arquivo foi enviado para uma ata inexistente
        const multerPath = path.resolve(__dirname, '../../', req.file.path);
        if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
      }
      return res.status(404).json({ message: 'Ata não encontrada.' });
    }

    const dadosAtualizados = {};
    if (numero !== undefined) dadosAtualizados.numero = numero;
    if (ano !== undefined) dadosAtualizados.ano = parseInt(ano, 10);
    if (dataDeAprovacao !== undefined) dadosAtualizados.dataDeAprovacao = dataDeAprovacao || null;

    let oldFilePath = ataExistente.path;

    if (req.file) { // Novo arquivo enviado
      if (oldFilePath) {
        removeFile(oldFilePath); // Remove o arquivo antigo
      }
      // Salva o path relativo à pasta 'uploads/'
      dadosAtualizados.path = req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length);
    }

    await ataExistente.update(dadosAtualizados);
    const ataAtualizada = await db.Ata.findByPk(id, {
        include: [{
            model: db.MasonicSession,
            attributes: ['id', 'dataSessao', 'tipoSessao', 'subtipoSessao'],
        }],
    });
    res.status(200).json(ataAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar ata:', error);
    if (req.file && req.file.path) { // Se um arquivo foi upado mas a atualização do DB falhou
      const multerPath = path.resolve(__dirname, '../../', req.file.path);
      if (fs.existsSync(multerPath)) fs.unlinkSync(multerPath);
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao atualizar ata.', errorDetails: error.message });
  }
};

// Deletar uma Ata (CUIDADO: Deixa a MasonicSession órfã de ata)
export const deleteAta = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.Ata) {
        console.error("[deleteAta] Modelo Ata não disponível em db.");
        return res.status(500).json({ message: "Erro interno: Modelo Ata não inicializado." });
    }
    const ata = await db.Ata.findByPk(id);
    if (!ata) {
      return res.status(404).json({ message: 'Ata não encontrada.' });
    }

    // Lembre-se que o modelo Ata tem onDelete: 'CASCADE' na associação com MasonicSession.
    // No entanto, a FK está em Ata (sessionId). Deletar a Ata aqui não deleta a sessão.
    // Mas a sessão ficará sem ata, o que pode ser um problema se sessionId em Ata é allowNull:false.
    // No modelo Ata, sessionId é allowNull: false, e unique:true (1-para-1).
    // Isso significa que uma MasonicSession PRECISA de uma Ata se a relação for estrita.
    // A associação em MasonicSession é hasOne Ata com onDelete: 'CASCADE' na FK sessionId da Ata.
    // Portanto, deletar a Ata diretamente aqui é problemático.
    // Uma abordagem melhor seria NUNCA deletar uma ata individualmente,
    // apenas através da deleção da MasonicSession, ou permitir apenas a substituição do arquivo/metadados.

    // Por segurança, vamos comentar a deleção direta e sugerir que não seja usada.
    // Se realmente precisar, o código seria:
    /*
    if (ata.path) {
      removeFile(ata.path);
    }
    await ata.destroy();
    res.status(200).json({ message: 'Ata deletada com sucesso. A sessão associada agora não tem ata.' });
    */
    console.warn(`Tentativa de deletar Ata ID: ${id} individualmente. Esta operação é desaconselhada.`);
    res.status(403).json({ message: 'A deleção individual de atas não é permitida. As atas são gerenciadas através das Sessões Maçônicas.' });

  } catch (error) {
    console.error('Erro ao tentar deletar ata:', error);
    res.status(500).json({ message: 'Erro ao tentar deletar ata.', errorDetails: error.message });
  }
};

