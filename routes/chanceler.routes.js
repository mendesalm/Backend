// backend/routes/chanceler.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
// Importa as funções do controller dedicado ao Chanceler
import {
  gerarCartaoManual,
  getPanelData,
} from "../controllers/chanceler.controller.js";
import { query } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

const router = express.Router();

// Aplica a autenticação a todas as rotas deste ficheiro
router.use(authMiddleware);

// Validador para a rota do painel
const panelDataValidator = [
  query("dataInicio")
    .isISO8601()
    .toDate()
    .withMessage(
      "A data de início é obrigatória e deve estar no formato AAAA-MM-DD."
    ),
  query("dataFim")
    .isISO8601()
    .toDate()
    .withMessage(
      "A data de fim é obrigatória e deve estar no formato AAAA-MM-DD."
    ),
  validate,
];

// Rota correta para buscar os dados do painel do Chanceler
// O frontend deve chamar: GET /api/chanceler/panel?dataInicio=...&dataFim=...
router.get(
  "/panel",
  authorizeByFeature("acessarPainelChanceler"),
  panelDataValidator,
  getPanelData
);

// Rota correta para gerar cartão manualmente
router.post(
  "/gerar-cartao",
  authorizeByFeature("gerenciarCartoesAniversario"),
  gerarCartaoManual
);

export default router;
