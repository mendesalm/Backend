// validators/emprestimo.validator.js
import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const createEmprestimoRules = [
  body('livroId').isInt({ gt: 0 }).withMessage('ID do livro é obrigatório.'),
  body('membroId').isInt({ gt: 0 }).withMessage('ID do membro é obrigatório.'),
  body('dataDevolucaoPrevista').isISO8601().toDate().withMessage('Data de devolução prevista é obrigatória.'),
];

export const emprestimoIdParamRule = [
  param('emprestimoId').isInt({ gt: 0 }).withMessage('ID do empréstimo na URL é inválido.'),
];