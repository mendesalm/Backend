// backend/validators/ata.validator.js
import { body, param, validationResult } from 'express-validator';
import fs from 'fs';   // <--- Importação estática
import path from 'path'; // <--- Importação estática
// Não precisamos de fileURLToPath ou import.meta.url aqui se req.file.path for diretamente usável

export const handleValidationErrors = (req, res, next) => { // Não precisa ser async
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Se houver um arquivo carregado e ocorrer um erro de validação, remova o arquivo.
    if (req.file && req.file.path) {
      // req.file.path fornecido pelo Multer geralmente é o caminho absoluto ou
      // um caminho que fs.unlink pode usar diretamente.
      if (fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Erro ao remover arquivo órfão (ata) após falha de validação:", err, req.file.path);
          } else {
            console.log("Arquivo órfão (ata) removido após falha de validação:", req.file.path);
          }
        });
      } else {
        console.warn("Arquivo órfão (ata) (caminho de req.file.path) não encontrado para remoção, ou já removido:", req.file.path);
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para atualizar uma Ata (metadados e/ou arquivo)
export const updateAtaRules = [
  param('id').isInt({ gt: 0 }).withMessage('ID da ata na URL deve ser um inteiro positivo.'),
  body('numero')
    .if((value, { req }) => req.file)
    .notEmpty().withMessage('O número da ata é obrigatório se um novo arquivo de ata for enviado.')
    .trim().isLength({ max: 50 }).withMessage('Número da ata excede 50 caracteres.'),
  body('ano')
    .if((value, { req }) => req.file)
    .notEmpty().withMessage('O ano da ata é obrigatório se um novo arquivo de ata for enviado.')
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage(`Ano da ata inválido (deve ser entre 1900 e ${new Date().getFullYear() + 5}).`)
    .toInt(),
  body('numero')
    .optional()
    .trim().isLength({ max: 50 }).withMessage('Número da ata excede 50 caracteres.'),
  body('ano')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage(`Ano da ata inválido (deve ser entre 1900 e ${new Date().getFullYear() + 5}).`)
    .toInt(),
  body('dataDeAprovacao')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Data de aprovação da ata deve estar no formato YYYY-MM-DD, se fornecida.')
    .toDate(),
  // handleValidationErrors será chamado na rota após esta cadeia de validação
];

export const ataIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('ID da ata na URL deve ser um inteiro positivo.'),
  // handleValidationErrors será chamado na rota após esta cadeia de validação
];