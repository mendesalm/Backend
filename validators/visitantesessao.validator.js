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
  body("potencia").optional({ checkFalsy: true }).trim().escape(),
  body("loja").optional({ checkFalsy: true }).trim().escape(),
  body("oriente").optional({ checkFalsy: true }).trim().escape(),
];

export const visitorIdParamRule = [
  param("visitorId")
    .isInt({ gt: 0 })
    .withMessage("O ID do visitante deve ser um inteiro positivo."),
];
