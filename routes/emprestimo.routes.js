// routes/emprestimo.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as emprestimoController from '../controllers/emprestimo.controller.js';
import {
  createEmprestimoRules,
  emprestimoIdParamRule,
  handleValidationErrors
} from '../validators/emprestimo.validator.js';
import { lodgeMemberIdParamRule } from '../validators/lodgemember.validator.js';

// Router para as rotas principais de /api/emprestimos
const router = express.Router();
router.use(authMiddleware);

router.post('/',
  authorizeByFeature('registrarEmprestimo'),
  createEmprestimoRules,
  handleValidationErrors,
  emprestimoController.registrarEmprestimo
);

router.get('/',
  authorizeByFeature('listarEmprestimos'),
  emprestimoController.listarTodosEmprestimos
);

router.put('/:emprestimoId/devolver',
  authorizeByFeature('registrarDevolucao'),
  emprestimoIdParamRule,
  handleValidationErrors,
  emprestimoController.registrarDevolucao
);

// Router separado para a rota aninhada
const membroRouter = express.Router({ mergeParams: true });
membroRouter.use(authMiddleware);

membroRouter.get('/',
  (req, res, next) => {
      if (req.user.id === parseInt(req.params.membroId, 10)) {
          return authorizeByFeature('visualizarPropriosEmprestimos')(req, res, next);
      }
      return authorizeByFeature('listarEmprestimos')(req, res, next);
  },
  emprestimoController.listarEmprestimosDoMembro
);

export { router as emprestimoRoutes, membroRouter as emprestimoMembroRoutes };