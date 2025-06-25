import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import { gerarCartaoManual } from "../controllers/chanceler.controller.js";

const router = express.Router();
router.use(authMiddleware);

const canManage = authorizeByFeature("gerenciarCartoesAniversario");

router.post("/gerar-cartao", canManage, gerarCartaoManual);

export default router;
