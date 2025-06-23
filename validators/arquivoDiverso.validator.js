// validators/arquivoDiverso.validator.js
import { body } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const createArquivoDiversoValidator = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("O título do arquivo é obrigatório."),
  body("descricao").optional().isString(),
  body("dataPublicacao").optional({ checkFalsy: true }).isISO8601().toDate(),
  validate,
];

export const updateArquivoDiversoValidator = [
  body("titulo").optional().trim().notEmpty(),
  body("descricao").optional().isString(),
  body("dataPublicacao").optional({ checkFalsy: true }).isISO8601().toDate(),
  validate,
];
