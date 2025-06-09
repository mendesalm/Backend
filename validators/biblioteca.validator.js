import { body, param, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const createLivroValidator = [
  body('titulo').notEmpty().withMessage('Título é obrigatório').trim().escape(),
  body('autores').optional({ checkFalsy: true }).trim().escape(),
  body('editora').optional({ checkFalsy: true }).trim().escape(),
  body('anoPublicacao')
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano de publicação deve ser um ano válido.')
    .toInt(),
  body('ISBN')
    .optional({ checkFalsy: true })
    .isISBN()
    .withMessage('ISBN inválido.')
    .trim(),
  body('numeroPaginas')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Número de páginas deve ser um inteiro positivo.')
    .toInt(),
  body('classificacao').optional({ checkFalsy: true }).trim().escape(),
  body('observacoes').optional({ checkFalsy: true }).trim().escape(),
  // Não é necessário validar 'path', 'status', 'lodgeMemberId' aqui,
  // pois são gerenciados pelo controller/sistema.
  handleValidationErrors,
];

export const updateLivroValidator = [
  param('id').isInt().withMessage('ID do livro deve ser um inteiro.').toInt(),
  body('titulo').optional().notEmpty().withMessage('Título não pode ser vazio se fornecido.').trim().escape(),
  body('autores').optional({ checkFalsy: true }).trim().escape(),
  body('editora').optional({ checkFalsy: true }).trim().escape(),
  body('anoPublicacao')
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano de publicação deve ser um ano válido.')
    .toInt(),
  body('ISBN')
    .optional({ checkFalsy: true })
    .isISBN()
    .withMessage('ISBN inválido.')
    .trim(),
  body('numeroPaginas')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Número de páginas deve ser um inteiro positivo.')
    .toInt(),
  body('classificacao').optional({ checkFalsy: true }).trim().escape(),
  body('observacoes').optional({ checkFalsy: true }).trim().escape(),
  handleValidationErrors,
];

export const livroIdValidator = [
  param('id').isInt().withMessage('ID do livro deve ser um inteiro.').toInt(),
  handleValidationErrors,
];