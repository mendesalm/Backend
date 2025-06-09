// routes/menu_item.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as menuItemController from '../controllers/menu_item.controller.js';
import { menuItemRules, menuItemIdParamRule, handleValidationErrors } from '../validators/menu_item.validator.js';

const router = express.Router();
router.use(authMiddleware);

// Protege todas as rotas de gerenciamento de menu com a mesma permissão de gerenciar permissões
const canManageSystem = authorizeByFeature('editarConfiguracoesDePermissao');

router.post('/', canManageSystem, menuItemRules, handleValidationErrors, menuItemController.createMenuItem);
router.get('/', canManageSystem, menuItemController.getAllMenuItems);
router.put('/:id', canManageSystem, menuItemIdParamRule, handleValidationErrors, menuItemRules, handleValidationErrors, menuItemController.updateMenuItem);
router.delete('/:id', canManageSystem, menuItemIdParamRule, handleValidationErrors, menuItemController.deleteMenuItem);

export default router;
