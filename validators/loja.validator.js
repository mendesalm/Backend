// validators/loja.validator.js
import { body, param, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const lojaRules = [
  body("nome")
    .notEmpty()
    .withMessage("O nome da loja é obrigatório.")
    .trim()
    .escape(),
  body("numero")
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage("O número da loja deve ser um inteiro."),
  body("cidade").optional({ checkFalsy: true }).trim().escape(),
  body("estado")
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 2 })
    .withMessage("O estado deve ser uma sigla de 2 caracteres.")
    .trim()
    .escape(),
  body("potencia").optional({ checkFalsy: true }).trim().escape(),
];

export const lojaIdParamRule = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("ID da loja deve ser um inteiro positivo."),
];
