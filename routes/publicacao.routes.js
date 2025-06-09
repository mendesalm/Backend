// backend/routes/publicacao.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as publicacaoController from '../controllers/publicacao.controller.js';
import { uploadPublicacao } from '../middlewares/upload.middleware.js';
import {
  publicacaoRules,
  publicacaoIdParamRule,
  publicacaoQueryValidator,
  handleValidationErrors
} from '../validators/publicacao.validator.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/publicacoes
router.post(
  '/',
  authorizeByFeature('criarNovaPublicacao'),
  uploadPublicacao.single('arquivoPublicacao'),
  publicacaoRules(false),
  handleValidationErrors,
  publicacaoController.createPublicacao
);

// GET /api/publicacoes
router.get(
  '/',
  authorizeByFeature('listarTodasPublicacoes'),
  publicacaoQueryValidator,
  handleValidationErrors,
  publicacaoController.getAllPublicacoes
);

// GET /api/publicacoes/:id
router.get(
  '/:id',
  authorizeByFeature('visualizarDetalhesPublicacao'),
  publicacaoIdParamRule,
  handleValidationErrors,
  publicacaoController.getPublicacaoById
);

// PUT /api/publicacoes/:id
router.put(
  '/:id',
  authorizeByFeature('editarPublicacaoExistente'),
  publicacaoIdParamRule,
  handleValidationErrors,
  uploadPublicacao.single('arquivoPublicacao'),
  publicacaoRules(true),
  handleValidationErrors,
  publicacaoController.updatePublicacao
);

// DELETE /api/publicacoes/:id
router.delete(
  '/:id',
  authorizeByFeature('deletarPublicacao'),
  publicacaoIdParamRule,
  handleValidationErrors,
  publicacaoController.deletePublicacao
);

export default router;