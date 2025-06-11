// backend/routes/masonicsession.routes.js
import express from 'express';
import * as masonicSessionController from '../controllers/masonicsession.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
// Removido: import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// Adicionado: Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import { uploadAta } from '../middlewares/upload.middleware.js';
import {
    sessionRules,
    sessionIdParamRule,
    handleValidationErrors
} from '../validators/masonicsession.validator.js';

const router = express.Router();

// Aplicar autenticação a todas as rotas de sessão
router.use(authMiddleware);

// POST /api/sessions - Criar nova sessão (com upload de ata)
router.post(
  '/',
  authorizeByFeature('criarSessaoMaconica'), // <-- Nova autorização
  uploadAta.single('ataFile'),
  sessionRules(false),
  handleValidationErrors,
  masonicSessionController.createSession
);

// GET /api/sessions - Listar todas as sessões
router.get(
    '/',
    authorizeByFeature('listarSessoes'), // <-- Nova autorização
    masonicSessionController.getAllSessions
);

// GET /api/sessions/:id - Obter uma sessão específica
router.get(
    '/:id',
    authorizeByFeature('visualizarDetalhesSessaoMaconica'), // <-- Nova autorização
    sessionIdParamRule(),
    handleValidationErrors,
    masonicSessionController.getSessionById
);

// PUT /api/sessions/:id - Atualizar uma sessão (com possível upload de nova ata)
router.put(
  '/:id',
  authorizeByFeature('editarSessaoMaconica'), // <-- Nova autorização
  uploadAta.single('ataFile'),
  sessionIdParamRule(),
  sessionRules(true),
  handleValidationErrors,
  masonicSessionController.updateSession
);

// DELETE /api/sessions/:id - Deletar uma sessão
router.delete(
  '/:id',
  authorizeByFeature('deletarSessaoMaconica'), // <-- Nova autorização
  sessionIdParamRule(),
  handleValidationErrors,
  masonicSessionController.deleteSession
);

export default router;