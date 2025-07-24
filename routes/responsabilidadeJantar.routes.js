import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import { swapResponsabilidadeJantarOrderController, reorderResponsabilidadesJantarController } from "../controllers/responsabilidadeJantar.controller.js";

const router = express.Router();

router.use(authMiddleware);

// Rota para trocar a ordem de dois membros na escala de jantar
router.put(
  "/swap-order",
  authorizeByFeature("gerenciarEscalaJantar"), // Assuming a feature for managing dinner scale
  swapResponsabilidadeJantarOrderController
);

// Nova rota para reordenar arbitrariamente a escala de jantar
router.put(
  "/reorder",
  authorizeByFeature("gerenciarEscalaJantar"),
  reorderResponsabilidadesJantarController
);

export default router;
