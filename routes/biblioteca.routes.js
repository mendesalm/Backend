// backend/routes/biblioteca.routes.js
import express from 'express';
import * as bibliotecaController from '../controllers/biblioteca.controller.js'; // Certifique-se que este controller existe e está correto
import authMiddleware from '../middlewares/auth.middleware.js';
// Removido: import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// Adicionado: Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import { uploadLivro } from '../middlewares/upload.middleware.js';
import {
  createLivroValidator, // Você precisará criar/definir estes validadores
  updateLivroValidator,
  livroIdValidator
} from '../validators/biblioteca.validator.js'; // Você precisará criar este arquivo de validador
import reservaRoutes from './reserva.routes.js';

const router = express.Router();

// Aplica autenticação a todas as rotas de biblioteca primeiro
router.use(authMiddleware);

// POST /api/biblioteca - Criar um novo livro
router.post(
  '/',
  authorizeByFeature('adicionarLivroBiblioteca'), // <-- Nova autorização
  uploadLivro.single('bibliotecaFile'), // 'bibliotecaFile' ou 'livroFile' conforme sua config de upload
  createLivroValidator,
  bibliotecaController.createLivro
);

// GET /api/biblioteca - Obter todos os livros
router.get(
  '/',
  authorizeByFeature('listarLivrosBiblioteca'), // <-- Nova autorização
  bibliotecaController.getAllLivros
);

// GET /api/biblioteca/:id - Obter um livro específico
router.get(
  '/:id',
  authorizeByFeature('visualizarDetalhesLivroBiblioteca'), // <-- Nova autorização
  livroIdValidator,
  bibliotecaController.getLivroById
);

// PUT /api/biblioteca/:id - Atualizar um livro
router.put(
  '/:id',
  authorizeByFeature('editarLivroBiblioteca'), // <-- Nova autorização
  uploadLivro.single('bibliotecaFile'),
  updateLivroValidator,
  bibliotecaController.updateLivro
);

// DELETE /api/biblioteca/:id - Deletar um livro
router.delete(
  '/:id',
  authorizeByFeature('deletarLivroBiblioteca'), // <-- Nova autorização
  livroIdValidator,
  bibliotecaController.deleteLivro
);

router.use('/:livroId/reservas', reservaRoutes);

export default router;