// routes/visitacao.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as visitaController from "../controllers/visitacao.controller.js";
import {
  visitaRules,
  visitaIdParamRule,
  handleValidationErrors,
} from "../validators/visitacao.validator.js";

const router = express.Router();

router.use(authMiddleware);

// --- ESTRUTURA DE ROTAS CORRIGIDA ---

// Rotas específicas (sem parâmetros) definidas primeiro.
// A rota GET /lojas/search foi REMOVIDA deste ficheiro para resolver o erro.
// Ela agora reside em `loja.routes.js`.

// Rota para criar um novo registo de visitação
router.post(
  "/",
  authorizeByFeature("registrarNovaVisita"),
  visitaRules,
  handleValidationErrors,
  visitaController.createVisita
);

// Rota para listar todas as visitações
router.get(
  "/",
  authorizeByFeature("listarVisitas"),
  visitaController.getAllVisitas
);

// Rotas genéricas (com parâmetros) definidas por último.

// Rota para obter uma visitação específica por ID
router.get(
  "/:id",
  authorizeByFeature("listarVisitas"),
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.getVisitaById
);

// Rota para atualizar uma visitação
router.put(
  "/:id",
  authorizeByFeature("editarVisita"),
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.updateVisita
);

// Rota para apagar uma visitação
router.delete(
  "/:id",
  authorizeByFeature("deletarVisita"),
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.deleteVisita
);

export default router;
