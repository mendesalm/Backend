// routes/evento.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as eventoController from '../controllers/evento.controller.js';
import fotoRoutes from './foto_evento.routes.js'
import {
  eventoRules,
  eventoIdParamRule,
  presencaRules,
  handleValidationErrors
} from '../validators/evento.validator.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/',
  authorizeByFeature('criarEvento'),
  eventoRules, handleValidationErrors,
  eventoController.createEvento
);

router.get('/',
  authorizeByFeature('visualizarCalendario'),
  eventoController.getAllEventos
);

router.get('/:id',
  authorizeByFeature('visualizarCalendario'),
  eventoIdParamRule, handleValidationErrors,
  eventoController.getEventoById
);

router.put('/:id',
  authorizeByFeature('editarEvento'),
  eventoIdParamRule, handleValidationErrors,
  eventoRules, handleValidationErrors,
  eventoController.updateEvento
);

router.delete('/:id',
  authorizeByFeature('deletarEvento'),
  eventoIdParamRule, handleValidationErrors,
  eventoController.deleteEvento
);

// Rota para o próprio membro confirmar/recusar presença
router.post('/:eventoId/presenca',
  authorizeByFeature('confirmarPresencaEvento'),
  eventoIdParamRule, // Reutiliza o validador para :eventoId
  handleValidationErrors,
  presencaRules,
  handleValidationErrors,
  eventoController.confirmarPresenca
);
router.use('/:eventoId/fotos', fotoRoutes);
export default router;
