// routes/classificado.routes.js
import express from "express";
import {
  createClassificado,
  getAllClassificados,
  getClassificadoById,
  updateClassificado,
  deleteClassificado,
} from "../controllers/classificado.controller.js";
import {
  createClassificadoValidator,
  updateClassificadoValidator,
} from "../validators/classificado.validator.js";
import { uploadFotoClassificado } from "../middlewares/upload.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Todas as rotas de classificados exigem que o usuário esteja autenticado.
router.use(authMiddleware);

// Rota para listar todos os classificados
router.get("/", getAllClassificados);

// Rota para buscar um classificado específico
router.get("/:id", getClassificadoById);

// Rota para criar um novo classificado
router.post(
  "/",
  // O multer espera até 5 arquivos no campo 'fotos'
  uploadFotoClassificado.array("fotos", 5),
  createClassificadoValidator,
  createClassificado
);

// Rota para atualizar um classificado
// A atualização de fotos não está inclusa nesta rota simplificada
router.put("/:id", updateClassificadoValidator, updateClassificado);

// Rota para deletar um classificado
router.delete("/:id", deleteClassificado);

export default router;
