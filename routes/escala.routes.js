import express from "express";
import {
  getEscala,
  updateOrdemEscala,
  getProximoResponsavel,
  getProximosResponsaveis, // Adicionando a nova função
  inicializarEscala, // Adicionando a nova função
  adicionarMembroEscala,
  updateStatusEscala,
  removerMembroEscala,
} from "../controllers/escala.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// Permissões
const canView = authorizeByFeature("visualizarEscalaJantar");
const canManage = authorizeByFeature("gerenciarEscalaJantar");

// Rotas de Visualização
router.get("/", canView, getEscala);
router.get("/proximo-responsavel", canView, getProximoResponsavel);
router.get("/proximos", canView, getProximosResponsaveis);

// Rotas de Gerenciamento
router.post("/inicializar", canManage, inicializarEscala);
router.post("/adicionar", canManage, adicionarMembroEscala); // Rota para adicionar um único membro
router.put("/ordenar", canManage, updateOrdemEscala);
router.put("/:escalaId/status", canManage, updateStatusEscala);
router.delete("/:escalaId", canManage, removerMembroEscala);

export default router;
