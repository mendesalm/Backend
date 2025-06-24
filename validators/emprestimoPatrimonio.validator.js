// validators/emprestimoPatrimonio.validator.js
import { body } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const createEmprestimoValidator = [
  body("dataRetirada")
    .isISO8601()
    .toDate()
    .withMessage("Data de retirada inválida."),
  body("dataDevolucaoPrevista")
    .isISO8601()
    .toDate()
    .withMessage("Data de devolução inválida."),
  body("itens")
    .isArray({ min: 1 })
    .withMessage("A lista de itens é obrigatória."),
  body("itens.*.patrimonioId")
    .isInt({ min: 1 })
    .withMessage("O ID do item de patrimônio é inválido."),
  body("itens.*.quantidade")
    .isInt({ min: 1 })
    .withMessage("A quantidade deve ser um número inteiro maior que zero."),
  validate,
];
