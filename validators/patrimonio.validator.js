// validators/patrimonio.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const patrimonioRules = [
  body('nome').notEmpty().withMessage('O nome do item é obrigatório.').trim().escape(),
  body('dataAquisicao').notEmpty().withMessage('A data de aquisição é obrigatória.').isISO8601().toDate(),
  body('valorAquisicao').notEmpty().withMessage('O valor de aquisição é obrigatório.').isDecimal({ decimal_digits: '2' }).withMessage('Valor deve ser um decimal com 2 casas.').toFloat(),
  body('estadoConservacao').isIn(['Novo', 'Bom', 'Regular', 'Necessita Reparo', 'Inservível']).withMessage('Estado de conservação inválido.'),
  body('descricao').optional({ checkFalsy: true }).trim().escape(),
  body('localizacao').optional({ checkFalsy: true }).trim().escape(),
];

export const patrimonioIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('O ID do item de patrimônio na URL deve ser um inteiro positivo.'),
];
