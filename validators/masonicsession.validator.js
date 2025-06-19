// backend/validators/masonicsession.validator.js
import { body, param, validationResult } from "express-validator";
import db from "../models/index.js";

// Lista de tipos e subtipos de sessão permitidos
const TIPO_SESSAO_ENUM = ["Ordinária", "Magna"];
const SUBTIPO_SESSAO_ENUM = ["Aprendiz", "Companheiro", "Mestre", "Pública"];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para criar ou atualizar uma MasonicSession
// ATUALIZADO: Removida a validação de 'presentesLodgeMemberIds' e 'visitantes'
export const sessionRules = (isUpdate = false) => {
  const validateIfNotUpdatingField = (fieldChain, fieldName) =>
    isUpdate
      ? fieldChain.optional({ checkFalsy: true })
      : fieldChain.notEmpty().withMessage(`${fieldName} é obrigatório.`);

  return [
    validateIfNotUpdatingField(body("dataSessao"), "Data da sessão")
      .isISO8601()
      .withMessage("Data da sessão deve estar no formato YYYY-MM-DD.")
      .toDate(),
    validateIfNotUpdatingField(body("tipoSessao"), "Tipo de sessão")
      .isIn(TIPO_SESSAO_ENUM)
      .withMessage(
        `Tipo de sessão inválido. Valores permitidos: ${TIPO_SESSAO_ENUM.join(
          ", "
        )}.`
      ),
    validateIfNotUpdatingField(body("subtipoSessao"), "Subtipo de sessão")
      .isIn(SUBTIPO_SESSAO_ENUM)
      .withMessage(
        `Subtipo de sessão inválido. Valores permitidos: ${SUBTIPO_SESSAO_ENUM.join(
          ", "
        )}.`
      ),

    body("troncoDeBeneficencia")
      .optional({ nullable: true })
      .isDecimal({ decimal_digits: "0,2" })
      .withMessage(
        "Valor do tronco de beneficência deve ser um número decimal válido (ex: 123.45)."
      )
      .toFloat(),

    body("responsavelJantarLodgeMemberId")
      .optional({ nullable: true })
      .isInt({ gt: 0 })
      .withMessage(
        "ID do responsável pelo jantar deve ser um inteiro positivo, se fornecido."
      )
      .custom(async (value) => {
        if (value) {
          const { LodgeMember } = db;
          if (!LodgeMember)
            throw new Error(
              "Modelo LodgeMember não inicializado para validação."
            );
          const member = await LodgeMember.findByPk(value);
          if (!member)
            throw new Error(
              `Maçom responsável pelo jantar com ID ${value} não encontrado.`
            );
        }
        return true;
      }),

    body("conjugeResponsavelJantarNome")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 }),

    // As validações de 'numeroAta' e 'anoAta' podem permanecer se a lógica de upload de arquivo
    // continuar atrelada à criação/edição da sessão.
    body("numeroAta")
      .if(
        (value, { req }) =>
          req.file ||
          (isUpdate && value !== undefined && value !== null && value !== "")
      )
      .notEmpty()
      .withMessage(
        "O número da ata é obrigatório se um arquivo de ata for fornecido/atualizado."
      )
      .trim()
      .isLength({ max: 50 })
      .withMessage("Número da ata excede 50 caracteres."),

    body("anoAta")
      .if(
        (value, { req }) =>
          req.file ||
          (isUpdate && value !== undefined && value !== null && value !== "")
      )
      .notEmpty()
      .withMessage(
        "O ano da ata é obrigatório se um arquivo de ata for fornecido/atualizado."
      )
      .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
      .withMessage(
        `Ano da ata inválido (deve ser entre 1900 e ${
          new Date().getFullYear() + 5
        }).`
      )
      .toInt(),

    body("dataDeAprovacaoAta")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .withMessage(
        "Data de aprovação da ata deve estar no formato YYYY-MM-DD, se fornecida."
      )
      .toDate(),
  ];
};

// Regra para validar o ID da sessão nos parâmetros da URL
export const sessionIdParamRule = () => {
  return [
    param("id")
      .isInt({ gt: 0 })
      .withMessage("ID da sessão na URL deve ser um inteiro positivo."),
  ];
};

// Regras para validar a atualização da lista de presença (para a rota dedicada)
export const setAttendeesRules = [
  body("presentMemberIds")
    .isArray()
    .withMessage("A lista de presentes (presentMemberIds) deve ser um array."),
  body("presentMemberIds.*")
    .isInt({ gt: 0 })
    .withMessage(
      "Cada ID na lista de presentes deve ser um número inteiro positivo."
    ),
];
