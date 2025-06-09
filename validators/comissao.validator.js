// validators/comissao.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const comissaoRules = (isUpdate = false) => [
  body('nome').optional(isUpdate).notEmpty().withMessage('O nome da comissão é obrigatório.'),
  body('tipo').optional(isUpdate).isIn(['Permanente', 'Temporária']).withMessage('O tipo deve ser "Permanente" ou "Temporária".'),
  body('dataInicio').optional(isUpdate).isISO8601().toDate().withMessage('Data de início é obrigatória e deve estar no formato YYYY-MM-DD.'),
  body('dataFim').optional(isUpdate).isISO8601().toDate().withMessage('Data de fim é obrigatória e deve estar no formato YYYY-MM-DD.'),
  body('membrosIds')
    .optional(isUpdate)
    .isArray({ min: 1 }).withMessage('A lista de membros (membrosIds) é obrigatória.'),
  body('membrosIds.*').isInt({ gt: 0 }).withMessage('Cada ID de membro deve ser um número inteiro positivo.'),
];

export const comissaoIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('ID da comissão deve ser um inteiro positivo.'),
];