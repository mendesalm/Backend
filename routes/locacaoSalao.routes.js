// routes/locacaoSalao.routes.js
import express from "express";
import {
  createLocacao,
  getAllLocacoes,
  getCalendarioOcupacao,
  confirmarLocacao,
  cancelarLocacao,
  encerrarLocacao,
  updateLocacao,
  deleteLocacao,
} from "../controllers/locacaoSalao.controller.js";
import {
  createLocacaoValidator,
  updateLocacaoValidator, // 1. Importar o novo validador
  calendarioQueryValidator,
} from "../validators/locacaoSalao.validator.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();

router.use(authMiddleware);

const canManage = authorizeByFeature("gerenciar-locacao-salao");

router.get("/", canManage, getAllLocacoes);
router.put("/:id/confirmar", canManage, confirmarLocacao);
router.put("/:id/cancelar", canManage, cancelarLocacao);
router.put("/:id/encerrar", canManage, encerrarLocacao);
// Rota de atualização agora usando seu próprio validador
router.put(
  "/:id",
  canManage,
  updateLocacaoValidator, // 2. Usar o validador correto
  updateLocacao
);

router.delete("/:id", canManage, deleteLocacao);

router.get("/calendario", calendarioQueryValidator, getCalendarioOcupacao);
router.post("/", createLocacaoValidator, createLocacao);

export default router;
