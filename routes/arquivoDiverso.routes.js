// routes/arquivoDiverso.routes.js
import express from "express";
import {
  createArquivoDiverso,
  getAllArquivosDiversos,
  getArquivoDiversoById,
  updateArquivoDiverso,
  deleteArquivoDiverso,
} from "../controllers/arquivoDiverso.controller.js";
import {
  createArquivoDiversoValidator,
  updateArquivoDiversoValidator,
} from "../validators/arquivoDiverso.validator.js";
import { uploadArquivoDiverso } from "../middlewares/upload.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllArquivosDiversos);
router.get("/:id", authMiddleware, getArquivoDiversoById);

router.post(
  "/",
  authMiddleware,
  authorizeByFeature("gerenciar-arquivos-diversos"),
  uploadArquivoDiverso.single("documento"),
  createArquivoDiversoValidator,
  createArquivoDiverso
);
router.put(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-arquivos-diversos"),
  uploadArquivoDiverso.single("documento"),
  updateArquivoDiversoValidator,
  updateArquivoDiverso
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeByFeature("gerenciar-arquivos-diversos"),
  deleteArquivoDiverso
);

export default router;
