// controllers/foto_evento.controller.js
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';

const { FotoEvento, Evento } = db;

// Função auxiliar para remover o ficheiro físico
const removerFicheiro = (filePath) => {
  const fullPath = path.resolve(__dirname, '../uploads/', filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// Fazer upload de uma ou mais fotos para um evento
export const uploadFotos = async (req, res) => {
  const { eventoId } = req.params;
  const uploaderId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Nenhuma foto foi enviada.' });
  }

  try {
    const evento = await Evento.findByPk(eventoId);
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' });
    
    const fotosCriadas = [];
    for (const file of req.files) {
      const pathRelativo = file.path.replace(/\\/g, '/').substring(file.path.indexOf('uploads/') + 'uploads/'.length);
      const legenda = req.body[file.fieldname + '_legenda'] || null;

      const novaFoto = await FotoEvento.create({
        path: pathRelativo,
        legenda,
        eventoId: parseInt(eventoId, 10),
        uploaderId
      });
      fotosCriadas.push(novaFoto);
    }
    res.status(201).json(fotosCriadas);
  } catch (error) {
    // Limpar fotos já salvas se ocorrer um erro no meio do processo
    req.files.forEach(file => removerFicheiro(file.path));
    res.status(500).json({ message: 'Erro ao fazer upload das fotos.', errorDetails: error.message });
  }
};

// Deletar uma foto
export const deleteFoto = async (req, res) => {
  const { fotoId } = req.params;
  try {
    const foto = await FotoEvento.findByPk(fotoId);
    if (!foto) return res.status(404).json({ message: 'Foto não encontrada.' });

    // Regra de Negócio Opcional: permitir que apenas o uploader original ou um admin delete a foto.
    // if (foto.uploaderId !== req.user.id && req.user.credencialAcesso !== 'Webmaster') {
    //   return res.status(403).json({ message: 'Você não tem permissão para deletar esta foto.' });
    // }
    
    removerFicheiro(foto.path);
    await foto.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar a foto.', errorDetails: error.message });
  }
};
