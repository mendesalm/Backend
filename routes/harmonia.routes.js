// backend/routes/harmonia.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as harmoniaController from '../controllers/harmonia.controller.js';
import { uploadAudio } from '../middlewares/upload.middleware.js';
import {
  itemHarmoniaRules,
  itemIdParamRule,
  harmoniaQueryValidator,
  handleValidationErrors // Importar para usar explicitamente
} from '../validators/harmonia.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  authorizeByFeature('adicionarItemHarmonia'),
  uploadAudio.single('audioFile'), // 'audioFile' é o nome do campo no formulário multipart
  itemHarmoniaRules(false),
  handleValidationErrors, // Aplicar após as regras do corpo e upload
  harmoniaController.createItemHarmonia
);

router.get(
  '/',
  authorizeByFeature('listarItensHarmonia'),
  harmoniaQueryValidator, // Validar/sanitizar os query params
  handleValidationErrors, // Aplicar após validação da query
  harmoniaController.getAllItensHarmonia
);

router.get(
  '/:id',
  authorizeByFeature('visualizarDetalhesItemHarmonia'),
  itemIdParamRule, // Valida o parâmetro ID
  handleValidationErrors, // Aplicar após validação do parâmetro
  harmoniaController.getItemHarmoniaById
);

router.put(
  '/:id',
  authorizeByFeature('editarItemHarmonia'),
  itemIdParamRule, // Validar o ID primeiro
  handleValidationErrors, // Aplicar após validação do parâmetro
  uploadAudio.single('audioFile'), // Depois do ID e sua validação, antes das regras do corpo
  itemHarmoniaRules(true),
  handleValidationErrors, // Aplicar após regras do corpo e upload
  harmoniaController.updateItemHarmonia
);

router.delete(
  '/:id',
  authorizeByFeature('deletarItemHarmonia'),
  itemIdParamRule, // Valida o parâmetro ID
  handleValidationErrors, // Aplicar após validação do parâmetro
  harmoniaController.deleteItemHarmonia
);

export default router;