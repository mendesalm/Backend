// routes/documento.routes.js
import express from "express";
import {
  createDocumento,
  getAllDocumentos,
  getDocumentoById,
  updateDocumento,
  deleteDocumento,
} from "../controllers/documento.controller.js";
import {
  createDocumentoValidator,
  updateDocumentoValidator,
} from "../validators/documento.validator.js";
import { uploadDocumento } from "../middlewares/upload.middleware.js";

// --- CORREÇÃO FINAL E CORRETA ---
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();

// Rotas de leitura acessíveis para qualquer usuário autenticado
router.get("/", authMiddleware, getAllDocumentos);
router.get("/:id", authMiddleware, getDocumentoById);

// Rotas de escrita protegidas pelo sistema de permissão por funcionalidade
router.post(
  "/",
  authMiddleware,
  authorizeByFeature("gerenciar-documentos"), // <-- USANDO O MIDDLEWARE CORRETO
  uploadDocumento.single("documento"),
  createDocumentoValidator,
  createDocumento
);

router.put(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-documentos"), // <-- USANDO O MIDDLEWARE CORRETO
  uploadDocumento.single("documento"),
  updateDocumentoValidator,
  updateDocumento
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-documentos"), // <-- USANDO O MIDDLEWARE CORRETO
  deleteDocumento
);

export default router;
