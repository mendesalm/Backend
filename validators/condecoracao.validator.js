// validators/condecoracao.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const condecoracaoRules = [
  body('titulo').notEmpty().trim().escape().withMessage('Título da condecoração é obrigatório.'),
  body('dataRecebimento').notEmpty().isISO8601().toDate().withMessage('Data de recebimento é obrigatória e deve estar no formato YYYY-MM-DD.'),
  body('observacoes').optional({ nullable: true }).trim().escape(),
];

export const condecoracaoParamsRule = [
  param('lodgeMemberId').isInt({ gt: 0 }).withMessage('ID do membro na URL é inválido.'),
  param('condecoracaoId').isInt({ gt: 0 }).withMessage('ID da condecoração na URL é inválido.'),
];