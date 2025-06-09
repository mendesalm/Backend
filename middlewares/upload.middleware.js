// backend/middlewares/upload.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função genérica para criar um storage
const createStorage = (folderName) => {
  const storagePath = path.join(__dirname, '..', 'uploads', folderName);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
    console.log(`Diretório de upload para ${folderName} criado em: ${storagePath}`);
  }
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, storagePath),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
};

// Função genérica para filtro de ficheiros
const createFileFilter = (allowedTypesRegex) => {
  return (req, file, cb) => {
    const mimetype = allowedTypesRegex.test(file.mimetype);
    const extname = allowedTypesRegex.test(path.extname(file.originalname).toLowerCase());
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error(`Tipo de arquivo não suportado! Apenas ${allowedTypesRegex.toString()} são permitidos.`), false);
  };
};

// --- Configuração para Upload de Atas ---
export const uploadAta = multer({ 
  storage: createStorage('atas'),
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter: createFileFilter(/pdf|doc|docx/)
});

// --- Configuração para Upload de Publicações ---
export const uploadPublicacao = multer({
  storage: createStorage('publicacoes'),
  limits: { fileSize: 1024 * 1024 * 15 }, // 15MB
  fileFilter: createFileFilter(/pdf|doc|docx|txt/)
});

// --- Configuração para Upload de Livros (Biblioteca) ---
export const uploadLivro = multer({
  storage: createStorage('biblioteca'),
  limits: { fileSize: 1024 * 1024 * 25 }, // 25MB
  fileFilter: createFileFilter(/jpeg|jpg|png|gif|pdf|epub/)
});

// --- Configuração para Upload de Áudios (Harmonia) ---
export const uploadAudio = multer({
  storage: createStorage('harmonia'),
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
  fileFilter: createFileFilter(/mpeg|mp3|wav|aac|ogg|m4a|flac|wma/)
});

// --- Configuração para Upload de Fotos de Eventos ---
const fotoEventoDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
      const storagePath = path.join(__dirname, '..', 'uploads', 'eventos');
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
      cb(null, storagePath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // Adiciona o ID do evento ao nome do ficheiro para fácil identificação
    cb(null, `evento-${req.params.eventoId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadFotosEvento = multer({
  storage: fotoEventoDiskStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5MB por foto
  fileFilter: createFileFilter(/jpeg|jpg|png|gif|webp/)
});
