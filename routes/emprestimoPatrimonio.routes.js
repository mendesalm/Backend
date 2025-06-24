// routes/emprestimoPatrimonio.routes.js
import express from "express";
import {
  createEmprestimo,
  getAllEmprestimos,
  updateStatusEmprestimo,
} from "../controllers/emprestimoPatrimonio.controller.js";
import { createEmprestimoValidator } from "../validators/emprestimoPatrimonio.validator.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// Permissão para gerenciar (aprovar, cancelar, etc.)
const canManage = authorizeByFeature("gerenciar-locacao-patrimonio");

router.get("/", canManage, getAllEmprestimos);
router.put("/:id/status", canManage, updateStatusEmprestimo);

// Qualquer membro autenticado pode criar uma SOLICITAÇÃO
router.post("/", createEmprestimoValidator, createEmprestimo);

export default router;
