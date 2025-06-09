// validators/evento.validator.js
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const eventoRules = [
  body('titulo').notEmpty().withMessage('O título do evento é obrigatório.').trim().escape(),
  body('dataHoraInicio').notEmpty().withMessage('A data e hora de início são obrigatórias.').isISO8601().toDate(),
  body('local').notEmpty().withMessage('O local do evento é obrigatório.').trim().escape(),
  body('tipo').isIn(['Sessão Maçônica', 'Evento Social', 'Evento Filantrópico', 'Outro']).withMessage('Tipo de evento inválido.'),
  body('descricao').optional().trim().escape(),
];

export const eventoIdParamRule = [
  param('id').optional().isInt({ gt: 0 }).withMessage('O ID do evento na URL é inválido.'),
  param('eventoId').optional().isInt({ gt: 0 }).withMessage('O ID do evento na URL é inválido.'),
];

export const presencaRules = [
  body('statusConfirmacao').isIn(['Confirmado', 'Recusado']).withMessage('O status de confirmação deve ser "Confirmado" ou "Recusado".')
];
