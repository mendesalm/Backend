// validators/visitacao.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const visitaRules = [
  body('dataSessao').notEmpty().isISO8601().toDate().withMessage('Data da sessão é obrigatória e deve estar no formato YYYY-MM-DD.'),
  body('tipoSessao').notEmpty().trim().escape().withMessage('Tipo da sessão é obrigatório.'),
  body('lojaVisitada').notEmpty().trim().escape().withMessage('Loja visitada é obrigatório.'),
  body('orienteLojaVisitada').notEmpty().trim().escape().withMessage('Oriente da loja é obrigatório.'),
  body('lodgeMemberId').notEmpty().isInt({ gt: 0 }).withMessage('ID do membro visitante é obrigatório.'),
];

export const visitaIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('ID da visita deve ser um inteiro positivo.'),
];