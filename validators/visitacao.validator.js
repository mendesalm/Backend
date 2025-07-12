// validators/visitacao.validator.js
import { body, param, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const visitaRules = [
  // Valida os campos principais da visita
  body("dataSessao")
    .notEmpty()
    .isISO8601()
    .toDate()
    .withMessage(
      "Data da sessão é obrigatória e deve estar no formato YYYY-MM-DD."
    ),
  body("tipoSessao")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Tipo da sessão é obrigatório."),
  body("lodgeMemberId")
    .notEmpty()
    .isInt({ gt: 0 })
    .withMessage("ID do membro visitante é obrigatório."),

  // --- VALIDAÇÃO ATUALIZADA PARA O OBJETO dadosLoja ---
  // Garante que o objeto dadosLoja e seus campos obrigatórios existam
  body("dadosLoja")
    .notEmpty()
    .withMessage("Os dados da loja são obrigatórios."),
  body("dadosLoja.nome")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("O nome da loja visitada é obrigatório."),
  body("dadosLoja.cidade").optional({ checkFalsy: true }).trim().escape(),
  body("dadosLoja.estado")
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 2 })
    .withMessage("O estado deve ser uma sigla de 2 caracteres.")
    .trim()
    .escape(),
  body("dadosLoja.potencia").optional({ checkFalsy: true }).trim().escape(),
];

export const visitaIdParamRule = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("ID da visita deve ser um inteiro positivo."),
];
