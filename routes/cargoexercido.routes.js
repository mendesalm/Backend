// backend/routes/cargoexercido.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
// Removido: import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// Adicionado: Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as cargoExercidoController from '../controllers/cargoexercido.controller.js';
import {
  createCargoExercidoRules,
  updateCargoExercidoRules,
  cargoParamsRule,
  lodgeMemberIdParamRule,
  handleValidationErrors
} from '../validators/cargoexercido.validator.js';

const router = express.Router({ mergeParams: true });

// Aplicar middleware de autenticação
router.use(authMiddleware);

// POST /api/lodgemembers/:lodgeMemberId/cargos - Adicionar um novo cargo
router.post(
  '/',
  authorizeByFeature('adicionarCargoParaMembro'), // <-- Nova autorização
  lodgeMemberIdParamRule(),
  createCargoExercidoRules(),
  handleValidationErrors,
  cargoExercidoController.addCargoToLodgeMember
);

// GET /api/lodgemembers/:lodgeMemberId/cargos - Listar todos os cargos do maçom especificado
router.get(
  '/',
  (req, res, next) => {
    if (req.user.id === parseInt(req.params.lodgeMemberId, 10)) {
      // Se for o próprio usuário, usa a permissão de visualizar próprios cargos
      return authorizeByFeature('visualizarPropriosCargosExercidos')(req, res, next);
    }
    // Senão, aplica as regras para visualizar cargos de outros membros
    return authorizeByFeature('visualizarCargosExercidosDeMembro')(req, res, next);
  },
  lodgeMemberIdParamRule(),
  handleValidationErrors,
  cargoExercidoController.getCargosByLodgeMember
);

// GET /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Obter um cargo específico
router.get(
  '/:cargoId',
  (req, res, next) => {
    if (req.user.id === parseInt(req.params.lodgeMemberId, 10)) {
      // Se for o próprio usuário, usa a permissão de visualizar próprios cargos (detalhes)
      // Poderia ser uma funcionalidade mais granular como 'visualizarDetalhesProprioCargoExercido'
      // Por enquanto, reutilizamos 'visualizarPropriosCargosExercidos'
      return authorizeByFeature('visualizarPropriosCargosExercidos')(req, res, next);
    }
    // Senão, aplica as regras para visualizar cargos de outros membros
    return authorizeByFeature('visualizarCargosExercidosDeMembro')(req, res, next);
  },
  cargoParamsRule(),
  handleValidationErrors,
  cargoExercidoController.getCargoExercidoById
);

// PUT /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Atualizar um cargo específico
router.put(
  '/:cargoId',
  authorizeByFeature('editarCargoDeMembro'), // <-- Nova autorização
  cargoParamsRule(),
  updateCargoExercidoRules(),
  handleValidationErrors,
  cargoExercidoController.updateCargoExercido
);

// DELETE /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Remover um cargo específico
router.delete(
  '/:cargoId',
  authorizeByFeature('removerCargoDeMembro'), // <-- Nova autorização
  cargoParamsRule(),
  handleValidationErrors,
  cargoExercidoController.deleteCargoExercido
);

export default router;