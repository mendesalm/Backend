// backend/routes/biblioteca.routes.js
import express from "express";
import * as bibliotecaController from "../controllers/biblioteca.controller.js";
import * as emprestimoController from "../controllers/emprestimo.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import { uploadLivro } from "../middlewares/upload.middleware.js";
import {
  createLivroValidator,
  updateLivroValidator,
  livroIdValidator,
} from "../validators/biblioteca.validator.js";
import reservaRoutes from "./reserva.routes.js";

const router = express.Router();

// Aplica autenticação a todas as rotas de biblioteca primeiro
router.use(authMiddleware);

// --- ROTAS ESTÁTICAS E ESPECÍFICAS (DEFINIDAS PRIMEIRO) ---

// GET /api/biblioteca - Obter todos os livros (rota raiz)
router.get(
  "/",
  authorizeByFeature("listarLivrosBiblioteca"),
  bibliotecaController.getAllLivros
);

// POST /api/biblioteca - Criar um novo livro
router.post(
  "/",
  authorizeByFeature("adicionarLivroBiblioteca"),
  uploadLivro.single("bibliotecaFile"),
  createLivroValidator,
  bibliotecaController.createLivro
);

// Rota para o membro solicitar um empréstimo
router.post(
  "/solicitar-emprestimo",
  authorizeByFeature("solicitarEmprestimo"),
  emprestimoController.solicitarEmprestimo
);

// Rota para o admin listar as solicitações pendentes
router.get(
  "/solicitacoes",
  authorizeByFeature("gerenciarEmprestimos"),
  emprestimoController.listarSolicitacoes
);

// Rota para o admin aprovar uma solicitação
router.put(
  "/solicitacoes/:id/aprovar",
  authorizeByFeature("gerenciarEmprestimos"),
  emprestimoController.aprovarSolicitacao
);

// Rota para o admin rejeitar uma solicitação
router.put(
  "/solicitacoes/:id/rejeitar",
  authorizeByFeature("gerenciarEmprestimos"),
  emprestimoController.rejeitarSolicitacao
);

// --- ROTAS DINÂMICAS COM PARÂMETROS (DEFINIDAS POR ÚLTIMO) ---

// GET /api/biblioteca/:id - Obter um livro específico
router.get(
  "/:id",
  authorizeByFeature("visualizarDetalhesLivroBiblioteca"),
  livroIdValidator,
  bibliotecaController.getLivroById
);

// PUT /api/biblioteca/:id - Atualizar um livro
router.put(
  "/:id",
  authorizeByFeature("editarLivroBiblioteca"),
  uploadLivro.single("bibliotecaFile"),
  updateLivroValidator,
  bibliotecaController.updateLivro
);

// DELETE /api/biblioteca/:id - Deletar um livro
router.delete(
  "/:id",
  authorizeByFeature("deletarLivroBiblioteca"),
  livroIdValidator,
  bibliotecaController.deleteLivro
);

// Rotas aninhadas para reservas
router.use("/:livroId/reservas", reservaRoutes);

export default router;
