// validators/locacaoSalao.validator.js
import { body, query } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const createLocacaoValidator = [
  body("dataInicio")
    .notEmpty()
    .withMessage("A data de início é obrigatória.")
    .isISO8601()
    .withMessage("Formato de data de início inválido.")
    .toDate(),
  body("dataFim")
    .notEmpty()
    .withMessage("A data de fim é obrigatória.")
    .isISO8601()
    .withMessage("Formato de data de fim inválido.")
    .toDate()
    .custom((dataFim, { req }) => {
      if (dataFim <= req.body.dataInicio) {
        throw new Error("A data de fim deve ser posterior à data de início.");
      }
      return true;
    }),
  body("finalidade")
    .trim()
    .notEmpty()
    .withMessage("A finalidade da locação é obrigatória."),
  body("ehNaoOneroso")
    .isBoolean()
    .withMessage('O campo "ehNaoOneroso" deve ser true ou false.'),
  body("valor")
    .optional({ checkFalsy: true })
    .isDecimal()
    .withMessage("O valor deve ser um número decimal."),
  // Garante que ou um membro ou um locatário externo seja fornecido
  body().custom((value) => {
    if (!value.lodgeMemberId && !value.nomeLocatarioExterno) {
      throw new Error(
        "É necessário informar um Membro ou um Locatário Externo."
      );
    }
    if (value.lodgeMemberId && value.nomeLocatarioExterno) {
      throw new Error(
        "Informe apenas um Membro ou um Locatário Externo, não ambos."
      );
    }
    return true;
  }),
  validate,
];
export const updateLocacaoValidator = [
  // Na atualização, todos os campos são opcionais
  body("dataInicio").optional().isISO8601().toDate(),
  body("dataFim").optional().isISO8601().toDate(),
  body("finalidade").optional().trim().notEmpty(),
  body("ehNaoOneroso").optional().isBoolean(),
  body("valor").optional({ checkFalsy: true }).isDecimal(),
  // Adicionamos a mesma validação de datas do create, mas apenas se ambas forem fornecidas
  body().custom((value) => {
    if (
      value.dataInicio &&
      value.dataFim &&
      new Date(value.dataFim) <= new Date(value.dataInicio)
    ) {
      throw new Error("A data de fim deve ser posterior à data de início.");
    }
    return true;
  }),
  validate,
];
export const calendarioQueryValidator = [
  query("ano").isInt({ min: 2000, max: 2100 }).withMessage("Ano inválido."),
  query("mes").isInt({ min: 1, max: 12 }).withMessage("Mês inválido (1-12)."),
  validate,
];
