// backend/utils/validationHelpers.js

import { validationResult } from "express-validator"; // 1. IMPORTAR A FUNÇÃO NECESSÁRIA

// 2. A NOVA FUNÇÃO 'validate'
/**
 * Middleware para processar os resultados da validação do express-validator.
 * Se houver erros, retorna uma resposta 400 com os detalhes.
 * Se não houver erros, passa para o próximo middleware.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Valida um número de CPF brasileiro.
 * Inclui a verificação dos dígitos verificadores.
 * @param {string} cpf - O CPF a ser validado (pode conter formatação).
 * @returns {boolean} - True se o CPF for válido, false caso contrário.
 */
export const isValidCPF = (cpf) => {
  if (typeof cpf !== "string") return false;
  cpf = cpf.replace(/[^\d]+/g, ""); // Remove caracteres não numéricos

  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false; // Verifica tamanho e se todos os dígitos são iguais

  cpf = cpf.split("").map((el) => +el);

  const calculateDigit = (slice) => {
    let sum = 0;
    for (let i = 0, j = slice.length + 1; i < slice.length; i++, j--) {
      sum += slice[i] * j;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const digit1 = calculateDigit(cpf.slice(0, 9));
  if (digit1 !== cpf[9]) return false;

  const digit2 = calculateDigit(cpf.slice(0, 10));
  if (digit2 !== cpf[10]) return false;

  return true;
};

/**
 * Valida um número de telefone brasileiro nos formatos (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 * @param {string} telefone - O telefone a ser validado.
 * @returns {boolean} - True se o telefone for válido, false caso contrário.
 */
export const isValidTelefone = (telefone) => {
  if (typeof telefone !== "string") return false;
  // Regex para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
  return telefoneRegex.test(telefone);
};
