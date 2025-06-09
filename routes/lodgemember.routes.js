// routes/lodgemember.routes.js
import express from 'express';
import * as lodgeMemberController from '../controllers/lodgemember.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import {
  updateMyProfileRules,
  createLodgeMemberRules,
  updateLodgeMemberByAdminRules,
  lodgeMemberIdParamRule,
  handleValidationErrors
} from '../validators/lodgemember.validator.js';

// Importa as rotas aninhadas
import cargoExercidoRoutes from './cargoexercido.routes.js';
import condecoracaoRoutes from './condecoracao.routes.js';

const router = express.Router();
router.use(authMiddleware);

// --- Rotas de Auto-serviço (/me) ---
// ... (código existente para /me) ...
router.get('/me', authorizeByFeature('visualizarProprioPerfil'), lodgeMemberController.getMyProfile);
router.put('/me', authorizeByFeature('editarProprioPerfil'), updateMyProfileRules(), handleValidationErrors, lodgeMemberController.updateMyProfile);

// --- Rotas Administrativas ---
// ... (código existente para as rotas / e /:id) ...
router.get('/', authorizeByFeature('listarTodosOsMembros'), lodgeMemberController.getAllLodgeMembers);
router.post('/', authorizeByFeature('criarNovoMembroPeloAdmin'), createLodgeMemberRules(), handleValidationErrors, lodgeMemberController.createLodgeMember);
router.get('/:id', authorizeByFeature('visualizarDetalhesDeMembroPorAdmin'), lodgeMemberIdParamRule(), handleValidationErrors, lodgeMemberController.getLodgeMemberById);
router.put('/:id', authorizeByFeature('editarMembroPorAdmin'), updateLodgeMemberByAdminRules(), handleValidationErrors, lodgeMemberController.updateLodgeMemberById);
router.delete('/:id', authorizeByFeature('deletarMembroPorAdmin'), lodgeMemberIdParamRule(), handleValidationErrors, lodgeMemberController.deleteLodgeMemberById);


// --- Montar Rotas Aninhadas ---
router.use('/:lodgeMemberId/cargos', cargoExercidoRoutes);
router.use('/:lodgeMemberId/condecoracoes', condecoracaoRoutes);
// A rota para empréstimos de membro foi movida para o app.js principal para simplificar

export default router;