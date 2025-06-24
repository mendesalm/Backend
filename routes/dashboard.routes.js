// routes/dashboard.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

// Importa AMBAS as funções do controller
import {
  getDashboardData,
  getCalendarioUnificado,
} from "../controllers/dashboard.controller.js";
// Importa o validador para o calendário
import { calendarioUnificadoValidator } from "../validators/dashboard.validator.js";

const router = express.Router();

// Aplica a autenticação a todas as rotas deste ficheiro
router.use(authMiddleware);

// Rota principal do dashboard para os cartões de estatísticas
router.get("/", authorizeByFeature("acessarDashboard"), getDashboardData);

// Rota para o calendário unificado
router.get(
  "/calendario-unificado",
  calendarioUnificadoValidator,
  getCalendarioUnificado
);

export default router;
