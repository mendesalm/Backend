// routes/solicitacao.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as emprestimoController from "../controllers/emprestimo.controller.js";

const router = express.Router();

// Todas as rotas de gestão de solicitações são protegidas e para administradores
router.use(authMiddleware, authorizeByFeature("gerenciarEmprestimos"));

router.get("/", emprestimoController.listarSolicitacoes);
router.put("/:id/aprovar", emprestimoController.aprovarSolicitacao);
router.put("/:id/rejeitar", emprestimoController.rejeitarSolicitacao);

export default router;
