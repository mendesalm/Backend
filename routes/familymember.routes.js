// backend/routes/familymember.routes.js
import express from 'express';
import * as familyMemberController from '../controllers/familymember.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
// Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
// Importa as funções de validação nomeadas
import {
  familyMemberRules,
  familyMemberIdParamRule,
  handleValidationErrors,
} from '../validators/familyMember.validator.js';

const router = express.Router();

// Aplica autenticação a todas as rotas de familiares
router.use(authMiddleware);

// POST /api/familymembers - Criar um novo familiar para o maçom logado
router.post(
  '/',
  authorizeByFeature('adicionarProprioFamiliar'), // <-- Nova autorização
  familyMemberRules(false),
  handleValidationErrors,
  familyMemberController.createFamilyMember
);

// GET /api/familymembers - Listar todos os familiares do maçom logado
router.get(
  '/',
  authorizeByFeature('listarPropriosFamiliares'), // <-- Nova autorização
  familyMemberController.getFamilyMembersForCurrentUser
);

// GET /api/familymembers/:id - Obter um familiar específico por ID (do maçom logado)
router.get(
  '/:id',
  authorizeByFeature('visualizarDetalhesProprioFamiliar'), // <-- Nova autorização
  familyMemberIdParamRule(),
  handleValidationErrors,
  familyMemberController.getFamilyMemberById
);

// PUT /api/familymembers/:id - Atualizar um familiar específico por ID (do maçom logado)
router.put(
  '/:id',
  authorizeByFeature('editarProprioFamiliar'), // <-- Nova autorização
  familyMemberIdParamRule(),
  familyMemberRules(true),
  handleValidationErrors,
  familyMemberController.updateFamilyMember
);

// DELETE /api/familymembers/:id - Deletar um familiar específico por ID (do maçom logado)
router.delete(
  '/:id',
  authorizeByFeature('deletarProprioFamiliar'), // <-- Nova autorização
  familyMemberIdParamRule(),
  handleValidationErrors,
  familyMemberController.deleteFamilyMember
);

export default router;