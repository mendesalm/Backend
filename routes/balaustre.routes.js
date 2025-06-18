import express from "express";
// Importa as funções nomeadas do controller
import {
  getBalaustreDetails,
  updateBalaustre,
} from "../controllers/balaustre.controller.js";
// CORREÇÃO: Ajustado o caminho para 'middlewares' (plural) e a importação para default.
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// As rotas permanecem as mesmas
router.get("/:id", protect, getBalaustreDetails);
router.put("/:id", protect, updateBalaustre);

// Usa 'export default' para o objeto do router
export default router;
