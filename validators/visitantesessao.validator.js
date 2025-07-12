// validators/visitantesessao.validator.js
import { body, param, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const visitorRules = [
  body("nomeCompleto")
    .notEmpty()
    .withMessage("O nome completo é obrigatório.")
    .trim()
    .escape(),
  body("graduacao").optional({ checkFalsy: true }).trim().escape(),
  body("cim").optional({ checkFalsy: true }).trim().escape(),

  // --- VALIDAÇÃO ATUALIZADA PARA O OBJETO dadosLoja ---
  // A loja é opcional para um visitante, mas se for fornecida, o nome é obrigatório.
  body("dadosLoja.nome")
    .if(body("dadosLoja").exists()) // Só valida se o objeto 'dadosLoja' for enviado
    .notEmpty()
    .trim()
    .escape()
    .withMessage(
      "O nome da loja do visitante é obrigatório se os dados da loja forem fornecidos."
    ),
];

export const visitorIdParamRule = [
  param("visitorId")
    .isInt({ gt: 0 })
    .withMessage("O ID do visitante deve ser um inteiro positivo."),
];
