// validators/financeiro.validator.js
// VERSÃO FINAL: Validações de banco de dados foram reativadas e implementadas de forma robusta.
import { body, param, query, validationResult } from 'express-validator';
import db from '../models/index.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const contaRules = (isUpdate = false) => {
  const rules = [
    body('tipo').optional(isUpdate).isIn(['Receita', 'Despesa']).withMessage('O tipo da conta deve ser "Receita" ou "Despesa".'),
    body('descricao').optional({ checkFalsy: true }).trim().escape(),
  ];

  if (isUpdate) {
    rules.unshift(body('nome').optional().trim().escape());
  } else {
    rules.unshift(body('nome').notEmpty().withMessage('O nome da conta é obrigatório.').trim().escape());
  }

  return rules;
};

// COMPLETO: Validações customizadas que acessam o banco de dados estão reativadas.
export const lancamentoRules = () => [
  body('descricao').notEmpty().withMessage('Descrição é obrigatória.').trim().escape(),
  body('valor').isDecimal({ decimal_digits: '2' }).withMessage('Valor deve ser um decimal com 2 casas.').toFloat(),
  body('dataLancamento').isISO8601().withMessage('Data do lançamento é obrigatória e deve ser no formato YYYY-MM-DD.'),
  body('contaId').isInt({ gt: 0 }).withMessage('ID da conta é obrigatório.')
    .custom(async (value) => {
      if (!db.Conta) return Promise.reject('Modelo Conta não está disponível.');
      const conta = await db.Conta.findByPk(value);
      if (!conta) {
        return Promise.reject('A conta especificada não existe.');
      }
    }),
  body('membroId').optional({ checkFalsy: true }).isInt({ gt: 0 }).withMessage('ID do membro deve ser um inteiro positivo.')
    .custom(async (value) => {
      if (value) {
        if (!db.LodgeMember) return Promise.reject('Modelo LodgeMember não está disponível.');
        const membro = await db.LodgeMember.findByPk(value);
        if (!membro) {
          return Promise.reject('O membro especificado não existe.');
        }
      }
    }),
];

export const contaIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('O ID da conta na URL deve ser um inteiro positivo.'),
];

export const relatorioQueryRules = [
  query('mes').notEmpty().withMessage('O parâmetro "mes" é obrigatório.').isInt({ min: 1, max: 12 }).withMessage('O mês deve ser entre 1 e 12.'),
  query('ano').notEmpty().withMessage('O parâmetro "ano" é obrigatório.').isInt({ min: 2000, max: 2100 }).withMessage('O ano deve ser um ano válido.'),
];
export const orcamentoRules = [
  body('ano').isInt({ min: 2000, max: 2100 }).withMessage('Ano do orçamento é obrigatório e deve ser válido.'),
  body('valorOrcado').isDecimal({ decimal_digits: '2' }).withMessage('Valor orçado deve ser um decimal com 2 casas.').toFloat(),
  body('contaId').isInt({ gt: 0 }).withMessage('ID da conta é obrigatório.'),
];

export const orcamentoQueryRules = [
  query('ano').notEmpty().isInt({min: 2000, max: 2100}).withMessage('O ano é obrigatório e deve ser um ano válido.'),
];