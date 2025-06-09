// routes/condecoracao.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as condecoracaoController from '../controllers/condecoracao.controller.js';
import {
  condecoracaoRules,
  condecoracaoParamsRule,
  handleValidationErrors
} from '../validators/condecoracao.validator.js';

const router = express.Router({ mergeParams: true }); // mergeParams é crucial para rotas aninhadas

router.use(authMiddleware);

router.post('/',
  authorizeByFeature('registrarCondecoracao'),
  condecoracaoRules,
  handleValidationErrors,
  condecoracaoController.addCondecoracao
);

router.get('/',
  authorizeByFeature('listarCondecoracoesDeMembro'),
  condecoracaoController.getCondecoracoesByLodgeMember
);

router.put('/:condecoracaoId',
  authorizeByFeature('editarCondecoracao'),
  condecoracaoParamsRule,
  condecoracaoRules,
  handleValidationErrors,
  condecoracaoController.updateCondecoracao
);

router.delete('/:condecoracaoId',
  authorizeByFeature('deletarCondecoracao'),
  condecoracaoParamsRule,
  handleValidationErrors,
  condecoracaoController.deleteCondecoracao
);

export default router;