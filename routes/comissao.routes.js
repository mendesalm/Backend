// routes/comissao.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as comissaoController from '../controllers/comissao.controller.js';
import {
  comissaoRules,
  comissaoIdParamRule,
  handleValidationErrors
} from '../validators/comissao.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/',
  authorizeByFeature('criarComissao'),
  comissaoRules(false),
  handleValidationErrors,
  comissaoController.createComissao
);

router.get('/',
  authorizeByFeature('listarComissoes'),
  comissaoController.getAllComissoes
);

router.get('/:id',
  authorizeByFeature('listarComissoes'),
  comissaoIdParamRule,
  handleValidationErrors,
  comissaoController.getComissaoById
);

router.put('/:id',
  authorizeByFeature('editarComissao'),
  comissaoIdParamRule,
  handleValidationErrors,
  comissaoRules(true),
  handleValidationErrors,
  comissaoController.updateComissao
);

router.delete('/:id',
  authorizeByFeature('deletarComissao'),
  comissaoIdParamRule,
  handleValidationErrors,
  comissaoController.deleteComissao
);

export default router;