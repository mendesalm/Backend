// backend/validators/relatorios.validator.js
import { query } from "express-validator";
import { validate } from "../utils/validationHelpers.js";

export const validacaoPeriodo = [
  query("dataInicio")
    .isISO8601()
    .toDate()
    .withMessage("A data de início deve estar no formato AAAA-MM-DD."),
  query("dataFim")
    .isISO8601()
    .toDate()
    .withMessage("A data de fim deve estar no formato AAAA-MM-DD."),
  validate,
];

export const validacaoMes = [
  query("mes")
    .isInt({ min: 1, max: 12 })
    .withMessage("O mês deve ser um número entre 1 e 12."),
  validate,
];

export const validacaoFinanceiroDetalhado = [
  query("dataInicio")
    .isISO8601()
    .toDate()
    .withMessage("A data de início é obrigatória."),
  query("dataFim")
    .isISO8601()
    .toDate()
    .withMessage("A data de fim é obrigatória."),
  query("contaId")
    .isInt({ min: 1 })
    .withMessage("O ID da conta é obrigatório."),
  validate,
];

export const validacaoEmprestimos = [
  query("tipo")
    .isIn(["ativos", "historico"])
    .withMessage("O tipo deve ser 'ativos' ou 'historico'."),
  query("livroId")
    .if(query("tipo").equals("historico"))
    .isInt({ min: 1 })
    .withMessage("O livroId é obrigatório para o histórico."),
  validate,
];
