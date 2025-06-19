import express from "express";
import {
  getEscala,
  updateOrdemEscala,
  getProximoResponsavel,
} from "../controllers/escala.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js"; // <-- Importar

const router = express.Router();

// Aplica a autenticação para todas as rotas
router.use(authMiddleware);

// Protege cada rota com sua permissão específica
router.get("/", authorizeByFeature("visualizarEscalaJantar"), getEscala);
router.put(
  "/ordenar",
  authorizeByFeature("gerenciarEscalaJantar"),
  updateOrdemEscala
);
router.get(
  "/proximo-responsavel",
  authorizeByFeature("visualizarEscalaJantar"),
  getProximoResponsavel
);

export default router;
