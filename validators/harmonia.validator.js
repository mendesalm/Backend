// backend/validators/harmonia.validator.js
import { body, query, param, validationResult } from 'express-validator';
import fs from 'fs';   // <--- Importação estática
import path from 'path'; // <--- Importação estática
// Não precisamos de fileURLToPath ou import.meta.url aqui se req.file.path for diretamente usável

export const handleValidationErrors = (req, res, next) => { // Não é mais async
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Se houver um arquivo carregado e ocorrer um erro de validação, remova o arquivo.
    if (req.file && req.file.path) {
      // req.file.path fornecido pelo Multer geralmente é o caminho absoluto ou
      // um caminho que fs.unlink pode usar diretamente.
      if (fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Erro ao remover arquivo órfão após falha de validação:", err, req.file.path);
          } else {
            console.log("Arquivo órfão removido após falha de validação:", req.file.path);
          }
        });
      } else {
        console.warn("Arquivo órfão (caminho de req.file.path) não encontrado para remoção, ou já removido:", req.file.path);
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const itemHarmoniaRules = (isUpdate = false) => {
  const tituloValidation = body('titulo')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Título deve ter entre 1 e 255 caracteres.');

  return [
    isUpdate ? tituloValidation.optional({ checkFalsy: !isUpdate }) : tituloValidation.notEmpty().withMessage('Título é obrigatório.'),
    body('categoria').optional({ checkFalsy: true }).trim().escape().isLength({ max: 100 }).withMessage('Categoria excede 100 caracteres.'),
    body('subcategoria').optional({ checkFalsy: true }).trim().escape().isLength({ max: 100 }).withMessage('Subcategoria excede 100 caracteres.'),
    body('autor').optional({ checkFalsy: true }).trim().escape().isLength({ max: 255 }).withMessage('Autor excede 255 caracteres.'),
    body('path')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        if (req.file) {
          return true;
        }
        if (value) {
          if (!(value.startsWith('http://') || value.startsWith('https://'))) {
            // Descomente a linha abaixo se quiser forçar que seja uma URL se não for um arquivo
            // e se o campo 'path' só puder ser uma URL ou um arquivo de upload.
            // throw new Error('Path deve ser uma URL válida (http:// ou https://) se não for um arquivo de upload.');
          }
        }
        return true;
      }),
  ];
};

export const itemIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('ID do item de harmonia deve ser um inteiro positivo.'),
  // handleValidationErrors é chamado na rota após esta cadeia
];

export const harmoniaQueryValidator = [
    query('categoria').optional().isString().trim().escape(),
    query('subcategoria').optional().isString().trim().escape(),
    query('titulo').optional().isString().trim().escape(),
    query('autor').optional().isString().trim().escape(),
    // handleValidationErrors é chamado na rota após esta cadeia
];