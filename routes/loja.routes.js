// routes/loja.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as lojaController from "../controllers/loja.controller.js";
import {
  lojaRules,
  lojaIdParamRule,
  handleValidationErrors,
} from "../validators/loja.validator.js";

const router = express.Router();
router.use(authMiddleware);

// Permissão para gerir o cadastro de lojas
const canManageLojas = authorizeByFeature("gerenciarCadastroLojas");

// Rota para autocompletar, acessível por quem pode registrar visitas
// CORREÇÃO: A função de pesquisa agora é chamada a partir do 'lojaController' importado
router.get(
  "/search",
  authorizeByFeature("registrarNovaVisita"),
  lojaController.searchLojasVisitadas
);

// Rotas CRUD para gestão de Lojas
router.get("/", canManageLojas, lojaController.getAllLojas);
router.post(
  "/",
  canManageLojas,
  lojaRules,
  handleValidationErrors,
  lojaController.createLoja
);
router.get(
  "/:id",
  canManageLojas,
  lojaIdParamRule,
  handleValidationErrors,
  lojaController.getLojaById
);
router.put(
  "/:id",
  canManageLojas,
  lojaIdParamRule,
  handleValidationErrors,
  lojaRules,
  handleValidationErrors,
  lojaController.updateLoja
);
router.delete(
  "/:id",
  canManageLojas,
  lojaIdParamRule,
  handleValidationErrors,
  lojaController.deleteLoja
);

export default router;
