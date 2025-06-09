// validators/aviso.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const avisoRules = [
  body('titulo').notEmpty().withMessage('O título é obrigatório.').trim().escape(),
  body('conteudo').notEmpty().withMessage('O conteúdo é obrigatório.').trim(),
  body('dataExpiracao').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Data de expiração deve estar no formato AAAA-MM-DD.'),
  body('fixado').optional().isBoolean().withMessage('O campo "fixado" deve ser um booleano (true/false).'),
];

export const avisoIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('O ID do aviso na URL deve ser um inteiro positivo.'),
];
