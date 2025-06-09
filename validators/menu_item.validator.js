// validators/menu_item.validator.js
import { body, param, validationResult } from 'express-validator';
import db from '../models/index.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const menuItemRules = [
  body('label').notEmpty().withMessage('O rótulo (label) é obrigatório.').trim().escape(),
  body('path').notEmpty().withMessage('O caminho (path) é obrigatório.').trim(),
  body('requiredFeature').notEmpty().withMessage('A funcionalidade requerida é obrigatória.')
    .custom(async (value) => {
      // CORRIGIDO: Procura pelo nome da funcionalidade em vez do ID.
      const feature = await db.FuncionalidadePermissao.findOne({ where: { nomeFuncionalidade: value } });
      if (!feature) throw new Error('A funcionalidade requerida não existe.');
      return true;
    }),
  body('icon').optional().trim().escape(),
  body('parentId').optional({ nullable: true }).isInt().withMessage('O ID pai deve ser um número.'),
  body('ordem').optional().isInt().withMessage('A ordem deve ser um número.'),
];

export const menuItemIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('O ID do item de menu na URL deve ser um inteiro positivo.'),
];

