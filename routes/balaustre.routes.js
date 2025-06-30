import express from "express";
import {
  getBalaustreDetails,
  updateBalaustre,
  setNextBalaustreNumber,
} from "../controllers/balaustre.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js"; // <-- Importar

const router = express.Router();

// Aplica a autenticação para todas as rotas
router.use(authMiddleware);

// Protege cada rota com sua permissão específica
router.get(
  "/:id",
  authorizeByFeature("visualizarBalaustre"),
  getBalaustreDetails
);
router.put("/:id", authorizeByFeature("editarBalaustre"), updateBalaustre);

router.post(
  "/settings/next-number",
  authorizeByFeature("gerenciarConfiguracoes"),
  setNextBalaustreNumber
);

export default router;
