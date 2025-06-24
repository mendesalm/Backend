// validators/dashboard.validator.js
import { query } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const calendarioUnificadoValidator = [
  query("ano")
    .notEmpty()
    .withMessage("O ano é obrigatório.")
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Ano inválido."),
  query("mes")
    .notEmpty()
    .withMessage("O mês é obrigatório.")
    .isInt({ min: 1, max: 12 })
    .withMessage("Mês inválido (deve ser entre 1 e 12)."),
  validate,
];
