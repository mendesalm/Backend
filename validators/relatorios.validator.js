// validators/relatorios.validator.js
import { query, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para validar um período com data de início e fim
export const periodoRules = [
  query('dataInicio')
    .notEmpty().withMessage('O parâmetro "dataInicio" é obrigatório.')
    .isISO8601().toDate().withMessage('A data de início deve estar no formato AAAA-MM-DD.'),
  query('dataFim')
    .notEmpty().withMessage('O parâmetro "dataFim" é obrigatório.')
    .isISO8601().toDate().withMessage('A data de fim deve estar no formato AAAA-MM-DD.')
    .custom((dataFim, { req }) => {
      if (new Date(dataFim) < new Date(req.query.dataInicio)) {
        throw new Error('A data de fim não pode ser anterior à data de início.');
      }
      return true;
    }),
];

// Regras para validar um período de aniversário (apenas mês e dia são relevantes)
export const periodoAniversarioRules = [
    query('dataInicio').notEmpty().matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).withMessage('A data de início deve estar no formato MM-DD.'),
    query('dataFim').notEmpty().matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).withMessage('A data de fim deve estar no formato MM-DD.'),
];

// Regras para o relatório financeiro detalhado por conta
export const financeiroDetalhadoRules = [
  ...periodoRules,
  query('contaId').notEmpty().withMessage('O parâmetro "contaId" é obrigatório.').isInt({ gt: 0 }).withMessage('O ID da conta deve ser um número inteiro positivo.'),
];

// Regras para o relatório de histórico de empréstimos de um livro
export const historicoLivroRules = [
  query('livroId').notEmpty().withMessage('O parâmetro "livroId" é obrigatório.').isInt({ gt: 0 }).withMessage('O ID do livro deve ser um número inteiro positivo.'),
];
