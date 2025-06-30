// routes/lodgemember.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
// 1. Importar o novo middleware de upload
import { uploadFotoPerfil } from "../middlewares/upload.middleware.js";

import {
  getMyProfile,
  updateMyProfile,
  createLodgeMember,
  getAllLodgeMembers,
  getLodgeMemberById,
  updateLodgeMemberById,
  deleteLodgeMemberById,
} from "../controllers/lodgemember.controller.js";
import { addCargoToLodgeMember, getCargosByLodgeMember, deleteCargoExercido } from "../controllers/cargoexercido.controller.js";

const router = express.Router();

// --- Rotas de Perfil Pessoal ---
router.get("/me", authMiddleware, getMyProfile);

// CORREÇÃO APLICADA AQUI: Adicionado o middleware de upload
router.put(
  "/me",
  authMiddleware,
  uploadFotoPerfil.single("FotoPessoal"), // 2. Aplicar o multer
  updateMyProfile
);

// --- Rotas de Gestão (Admin) ---
router.get(
  "/",
  authMiddleware,
  authorizeByFeature("listarTodosMembros"),
  getAllLodgeMembers
);
router.post(
  "/",
  authMiddleware,
  authorizeByFeature("criarNovoMembro"),
  uploadFotoPerfil.none(), // Adicionado para processar multipart/form-data
  // CORREÇÃO: Adicionado o middleware para lidar com o campo SenhaHash
  // Este middleware é necessário para que o Multer processe o campo SenhaHash
  // mesmo que não seja um arquivo, garantindo que ele esteja disponível em req.body
  // quando o tipo de conteúdo é multipart/form-data.
  (req, res, next) => {
    if (req.body.SenhaHash) {
      req.body.password = req.body.SenhaHash;
    }
    next();
  },
  createLodgeMember
);
router.get(
  "/:id",
  authMiddleware,
  authorizeByFeature("visualizarQualquerMembro"),
  getLodgeMemberById
);

// CORREÇÃO APLICADA AQUI: Adicionado o middleware de upload
router.put(
  "/:id",
  authMiddleware,
  authorizeByFeature("editarQualquerMembro"),
  uploadFotoPerfil.single("FotoPessoal"), // 3. Aplicar o multer
  updateLodgeMemberById
);

router.post(
  "/:lodgeMemberId/cargos",
  authMiddleware,
  authorizeByFeature("adicionarCargoMembro"),
  addCargoToLodgeMember
);

router.get(
  "/:lodgeMemberId/cargos",
  authMiddleware,
  authorizeByFeature("listarCargosMembro"),
  getCargosByLodgeMember
);

router.delete(
  "/:lodgeMemberId/cargos/:cargoId",
  authMiddleware,
  authorizeByFeature("deletarCargoMembro"),
  deleteCargoExercido
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeByFeature("deletarQualquerMembro"),
  deleteLodgeMemberById
);

export default router;
