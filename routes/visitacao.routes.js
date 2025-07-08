// routes/visitacao.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as visitaController from '../controllers/visitacao.controller.js';
import {
  visitaRules,
  visitaIdParamRule,
  handleValidationErrors
} from '../validators/visitacao.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/',
  authorizeByFeature('registrarNovaVisita'),
  visitaRules,
  handleValidationErrors,
  visitaController.createVisita
);

router.get('/',
  authorizeByFeature('listarVisitas'),
  visitaController.getAllVisitas
);

router.get('/me',
  authorizeByFeature('listarVisitas'), // Reutilizando a permissão de listar para ver as próprias visitas
  visitaController.getVisitasByLodgeMemberId
);

router.get('/:id',
  authorizeByFeature('listarVisitas'), // Reutilizando a permissão de listar para ver detalhes
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.getVisitaById
);

router.put('/:id',
  authorizeByFeature('editarVisita'),
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.updateVisita
);

router.delete('/:id',
  authorizeByFeature('deletarVisita'),
  visitaIdParamRule,
  handleValidationErrors,
  visitaController.deleteVisita
);

export default router;