// validators/legislacao.validator.js

import { body } from "express-validator";
import { validate } from "../utils/validationHelpers.js"; // Importa seu helper de validação

/**
 * Validador para a criação de uma nova legislação.
 * Verifica se o título foi fornecido.
 * A presença do arquivo é verificada diretamente no controller, pois o multer já o processou.
 */
export const createLegislacaoValidator = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("O título da legislação é obrigatório.")
    .isString()
    .withMessage("O título deve ser um texto."),

  body("descricao")
    .optional()
    .isString()
    .withMessage("A descrição deve ser um texto."),

  body("dataPublicacao")
    .optional({ checkFalsy: true }) // Permite valores nulos ou strings vazias
    .isISO8601()
    .withMessage(
      "A data de publicação deve estar em um formato de data válido (YYYY-MM-DD)."
    )
    .toDate(),

  validate, // Este é o seu middleware que trata os resultados da validação
];

/**
 * Validador para a atualização de uma legislação.
 * Todos os campos são opcionais, permitindo a atualização parcial.
 */
export const updateLegislacaoValidator = [
  body("titulo")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("O título da legislação não pode ser vazio.")
    .isString()
    .withMessage("O título deve ser um texto."),

  body("descricao")
    .optional()
    .isString()
    .withMessage("A descrição deve ser um texto."),

  body("dataPublicacao")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage(
      "A data de publicação deve estar em um formato de data válido (YYYY-MM-DD)."
    )
    .toDate(),

  validate,
];
