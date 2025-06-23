// validators/classificado.validator.js
import { body } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

const tiposAnuncioValidos = ["Venda", "Compra", "Aluguel", "Doação", "Serviço"];

export const createClassificadoValidator = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("O título do anúncio é obrigatório."),

  body("descricao").trim().notEmpty().withMessage("A descrição é obrigatória."),

  body("tipoAnuncio")
    .isIn(tiposAnuncioValidos)
    .withMessage(
      `O tipo de anúncio deve ser um dos seguintes: ${tiposAnuncioValidos.join(
        ", "
      )}.`
    ),

  body("valor")
    .optional({ checkFalsy: true }) // Permite nulo ou string vazia
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("O valor deve ser um número decimal válido."),

  body("contato")
    .optional({ nullable: true })
    .isString()
    .withMessage("O contato deve ser um texto."),

  validate, // Middleware final que recolhe os erros
];

export const updateClassificadoValidator = [
  body("titulo")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("O título do anúncio não pode ser vazio."),

  body("descricao")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("A descrição não pode ser vazia."),

  body("tipoAnuncio")
    .optional()
    .isIn(tiposAnuncioValidos)
    .withMessage(
      `O tipo de anúncio deve ser um dos seguintes: ${tiposAnuncioValidos.join(
        ", "
      )}.`
    ),

  body("valor")
    .optional({ checkFalsy: true })
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("O valor deve ser um número decimal válido."),

  body("contato")
    .optional({ nullable: true })
    .isString()
    .withMessage("O contato deve ser um texto."),

  validate,
];
