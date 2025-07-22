import express from "express";
import {
  getBalaustreDetails,
  updateBalaustre,
  setNextBalaustreNumber,
  aprovarBalaustre, // Importar a função renomeada
  substituirMinuta,
  aprovarManualmenteBalaustre,
} from "../controllers/balaustre.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

import { uploadBalaustre } from "../middlewares/upload.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// Rota para substituir a minuta do balaústre com um novo PDF
router.post(
  "/:id/substituir-minuta",
  authorizeByFeature("editarBalaustre"),
  uploadBalaustre.single("balaustrePdf"), // "balaustrePdf" é o nome do campo no form-data
  substituirMinuta
);

// --- ROTA DE APROVAÇÃO (RENOMEADA DE ASSINATURA) ---
router.patch(
  "/:id/aprovar",
  authorizeByFeature("assinarDocumentos"), // A permissão pode ser a mesma
  aprovarBalaustre
);

// Rota para aprovação manual (bypass de assinaturas)
router.patch(
  "/:id/aprovar-manualmente",
  authorizeByFeature("editarBalaustre"), // Secretários e Webmaster
  aprovarManualmenteBalaustre
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
