import express from "express";
import {
  getBalaustreDetails,
  updateBalaustre,
  setNextBalaustreNumber,
  assinarBalaustre, // Importar a nova função
} from "../controllers/balaustre.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// --- NOVA ROTA DE ASSINATURA ---
router.post(
  "/:id/assinar",
  authorizeByFeature("assinarDocumentos"),
  assinarBalaustre
);

router.get(
  "/:id",
  authorizeByFeature("visualizarBalaustre"),
  getBalaustreDetails
);

router.put(
  "/:id",
  authorizeByFeature("editarBalaustre"),
  updateBalaustre
);

router.post(
  "/settings/next-number",
  authorizeByFeature("gerenciarConfiguracoes"),
  setNextBalaustreNumber
);

export default router;
