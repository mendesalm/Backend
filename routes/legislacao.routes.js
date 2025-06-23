// routes/legislacao.routes.js

import express from "express";
import {
  createLegislacao,
  getAllLegislacoes,
  getLegislacaoById,
  updateLegislacao,
  deleteLegislacao,
} from "../controllers/legislacao.controller.js";
import {
  createLegislacaoValidator,
  updateLegislacaoValidator,
} from "../validators/legislacao.validator.js";
import { uploadLegislacao } from "../middlewares/upload.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js"; // <- Importado

const router = express.Router();

// Rotas de leitura (GET) abertas para todos os membros autenticados
router.get("/", authMiddleware, getAllLegislacoes);
router.get("/:id", authMiddleware, getLegislacaoById);

// Rotas de escrita (POST, PUT, DELETE) protegidas pela nova funcionalidade
router.post(
  "/",
  authMiddleware,
  authorizeByFeature("gerenciar-legislacao"), // <-- CORRETO
  uploadLegislacao.single("documento"),
  createLegislacaoValidator,
  createLegislacao
);

router.put(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-legislacao"), // <-- CORRETO
  uploadLegislacao.single("documento"),
  updateLegislacaoValidator,
  updateLegislacao
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-legislacao"), // <-- CORRETO
  deleteLegislacao
);

export default router;
