// routes/patrimonio.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as patrimonioController from '../controllers/patrimonio.controller.js';
import {
  patrimonioRules,
  patrimonioIdParamRule,
  handleValidationErrors
} from '../validators/patrimonio.validator.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/',
  authorizeByFeature('gerenciarPatrimonio'),
  patrimonioRules, handleValidationErrors,
  patrimonioController.createPatrimonio
);

router.get('/',
  authorizeByFeature('visualizarPatrimonio'),
  patrimonioController.getAllPatrimonios
);

router.get('/:id',
  authorizeByFeature('visualizarPatrimonio'),
  patrimonioIdParamRule, handleValidationErrors,
  patrimonioController.getPatrimonioById
);

router.put('/:id',
  authorizeByFeature('gerenciarPatrimonio'),
  patrimonioIdParamRule, handleValidationErrors,
  patrimonioRules, handleValidationErrors,
  patrimonioController.updatePatrimonio
);

router.delete('/:id',
  authorizeByFeature('gerenciarPatrimonio'),
  patrimonioIdParamRule, handleValidationErrors,
  patrimonioController.deletePatrimonio
);

export default router;
