// backend/validators/publicacao.validator.js
import { body, query, param, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file && req.file.path) {
      if (fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Erro ao remover arquivo órfão (publicacao) após falha de validação:", err);
        });
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const publicacaoRules = (isUpdate = false) => {
  const commonRules = [
    body('tema').trim().escape().isLength({ min: 3, max: 255 }).withMessage('Tema deve ter entre 3 e 255 caracteres.'),
    body('nome').trim().escape().isLength({ min: 3, max: 255 }).withMessage('Nome da publicação deve ter entre 3 e 255 caracteres.'),
    body('data').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Data deve estar no formato YYYY-MM-DD.'),
    body('grau').optional({ checkFalsy: true }).trim().escape().isLength({ max: 100 }).withMessage('Grau excede 100 caracteres.'),
  ];

  if (isUpdate) {
    return [
      body('tema').optional().trim().escape().isLength({ min: 3, max: 255 }).withMessage('Tema deve ter entre 3 e 255 caracteres.'),
      body('nome').optional().trim().escape().isLength({ min: 3, max: 255 }).withMessage('Nome da publicação deve ter entre 3 e 255 caracteres.'),
      ...commonRules.slice(2), // Pega as regras de 'data' e 'grau'
    ];
  } else { // Regras de Criação
    return [
      body('tema').notEmpty().withMessage('Tema é obrigatório.'),
      body('nome').notEmpty().withMessage('Nome da publicação é obrigatório.'),
      ...commonRules
    ];
  }
};

export const publicacaoIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('ID da publicação deve ser um inteiro positivo.'),
  // handleValidationErrors será chamado na rota
];

export const publicacaoQueryValidator = [
    query('tema').optional().isString().trim().escape(),
    query('nome').optional().isString().trim().escape(),
    query('grau').optional().isString().trim().escape(),
    // handleValidationErrors será chamado na rota
];