// validators/documento.validator.js
import { body } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const createDocumentoValidator = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("O título do documento é obrigatório."),
  body("descricao").optional().isString(),
  body("dataPublicacao").optional({ checkFalsy: true }).isISO8601().toDate(),
  validate,
];

export const updateDocumentoValidator = [
  body("titulo").optional().trim().notEmpty(),
  body("descricao").optional().isString(),
  body("dataPublicacao").optional({ checkFalsy: true }).isISO8601().toDate(),
  validate,
];
