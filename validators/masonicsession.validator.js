// backend/validators/masonicsession.validator.js
import { body, param } from "express-validator";
import { validate } from "../utils/validationHelpers.js";
import db from "../models/index.js";

const TIPO_SESSAO_ENUM = ["Ordinária", "Magna", "Especial", "Econômica"];
const SUBTIPO_SESSAO_ENUM = [
  "Aprendiz",
  "Companheiro",
  "Mestre",
  "Exaltação",
  "Iniciação",
  "Elevação",
  "Pública",
];

// --- CUSTOM VALIDATOR ---
const parseAndValidateDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!regex.test(dateString)) {
    throw new Error(
      "O formato da dataSessao é inválido. Use YYYY-MM-DDTHH:mm."
    );
  }

  console.log(`[Validator] Input dateString: ${dateString}`);
  // Append São Paulo timezone offset (-03:00) to the date string
  // This assumes São Paulo is consistently -03:00 and doesn't account for DST changes, which is usually fine for fixed offsets.
  const dateWithTimezone = `${dateString}:00-03:00`;
  console.log(`[Validator] Date string with timezone: ${dateWithTimezone}`);
  const date = new Date(dateWithTimezone);
  console.log(`[Validator] Parsed Date (ISO): ${date.toISOString()}`);
  console.log(`[Validator] Parsed Date (Local String): ${date.toString()}`);

  if (isNaN(date.getTime())) {
    throw new Error("A dataSessao fornecida não é uma data e hora válidas.");
  }

  return date;
};

/**
 * Regras de validação para a criação de uma nova sessão.
 */
export const validateSessionCreation = [
  body("dataSessao")
    .notEmpty()
    .withMessage("O campo dataSessao é obrigatório.")
    .custom(parseAndValidateDate),
  body("tipoSessao")
    .notEmpty()
    .withMessage("O tipo da sessão é obrigatório.")
    .isIn(TIPO_SESSAO_ENUM)
    .withMessage(
      `Tipo de sessão inválido. Valores permitidos: ${TIPO_SESSAO_ENUM.join(
        ", "
      )}.`
    ),
  body("subtipoSessao")
    .notEmpty()
    .withMessage("O grau da sessão é obrigatório.")
    .isIn(SUBTIPO_SESSAO_ENUM)
    .withMessage(
      `Subtipo de sessão inválido. Valores permitidos: ${SUBTIPO_SESSAO_ENUM.join(
        ", "
      )}.`
    ),
  body("objetivoSessao").optional().isString(),
  validate,
];

/**
 * Regras de validação para a atualização de uma sessão.
 */
export const validateSessionUpdate = [
  body("dataSessao").optional().custom(parseAndValidateDate),
  body("tipoSessao").optional().isIn(TIPO_SESSAO_ENUM),
  body("subtipoSessao").optional().isIn(SUBTIPO_SESSAO_ENUM),
  body("troncoDeBeneficiencia").optional().isDecimal(),
  validate,
];

/**
 * Regras de validação para a atualização da lista de presença.
 */
export const validateAttendanceUpdate = [
  body("attendees")
    .isArray({ min: 1 })
    .withMessage(
      'O campo "attendees" deve ser um array com pelo menos um item.'
    ),
  body("attendees.*.lodgeMemberId")
    .isInt({ min: 1 })
    .withMessage("Cada participante deve ter um lodgeMemberId válido."),
  body("attendees.*.statusPresenca")
    .isIn(["Presente", "Justificado", "Ausente"])
    .withMessage("O status de presença é inválido."),
  validate,
];

/**
 * Regra para validar o ID da sessão nos parâmetros da URL
 */
export const sessionIdParamRule = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("ID da sessão na URL deve ser um inteiro positivo."),
  validate,
];
