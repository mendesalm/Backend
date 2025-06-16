// routes/template.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as templateController from "../controllers/template.controller.js";

const router = express.Router();

// Todas as rotas de templates exigem autenticação e uma permissão específica
router.use(authMiddleware);
const canManageTemplates = authorizeByFeature("gerenciarTemplates");

// Rota para listar todos os templates
router.get("/", canManageTemplates, templateController.getAllTemplates);

// Rota para obter os placeholders disponíveis para cada gatilho
router.get(
  "/placeholders",
  canManageTemplates,
  templateController.getAvailablePlaceholders
);

// Rota para atualizar um template específico
router.put("/:id", canManageTemplates, templateController.updateTemplate);

export default router;
