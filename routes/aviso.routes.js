// routes/aviso.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as avisoController from '../controllers/aviso.controller.js';
import {
  avisoRules,
  avisoIdParamRule,
  handleValidationErrors
} from '../validators/aviso.validator.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/',
  authorizeByFeature('criarAviso'),
  avisoRules, handleValidationErrors,
  avisoController.createAviso
);

router.get('/',
  authorizeByFeature('visualizarMuralDeAvisos'),
  avisoController.getAllAvisos
);

router.get('/:id',
  authorizeByFeature('visualizarMuralDeAvisos'),
  avisoIdParamRule, handleValidationErrors,
  avisoController.getAvisoById
);

router.put('/:id',
  authorizeByFeature('editarAviso'),
  avisoIdParamRule, handleValidationErrors,
  avisoRules, handleValidationErrors,
  avisoController.updateAviso
);

router.delete('/:id',
  authorizeByFeature('deletarAviso'),
  avisoIdParamRule, handleValidationErrors,
  avisoController.deleteAviso
);

export default router;
