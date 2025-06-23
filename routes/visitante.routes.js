import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as visitanteController from "../controllers/visitante.controller.js";

const router = express.Router();

// Aplica autenticação a todas as rotas de visitantes
router.use(authMiddleware);

/**
 * GET /api/visitantes/search?q={termo}
 * Rota para pesquisar por visitantes recorrentes para preenchimento automático.
 * Protegida pela mesma permissão de gerenciar visitantes.
 */
router.get(
  "/search",
  authorizeByFeature("gerenciarVisitantesSessao"),
  visitanteController.searchRecurringVisitors
);

export default router;
