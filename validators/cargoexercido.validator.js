// backend/validators/cargoexercido.validator.js
import { body, param, validationResult } from 'express-validator';

// Lista de cargos permitidos (do seu ENUM no modelo/migração)
// Esta lista deve ser mantida em sincronia com a definição do ENUM no modelo e na migração.
const NOME_CARGO_ENUM_VALUES = [
  "Venerável Mestre", "Primeiro Vigilante", "Segundo Vigilante", "Orador", "Orador Adjunto",
  "Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Tesoureiro", "Tesoureiro Adjunto",
  "Mestre de Cerimônias", "Mestre de Harmonia", "Mestre de Harmonia Adjunto", 
  "Arquiteto", "Arquiteto Adjunto", "Bibliotecário", "Bibliotecário Adjunto",
  "Primeiro Diácono", "Segundo Diácono", "Primeiro Experto", "Segundo Experto", 
  "Cobridor Interno", "Cobridor Externo", "Hospitaleiro", "Porta Bandeira", 
  "Porta Estandarte", "Deputado Estadual", "Deputado Federal", "Sem cargo definido"
];

// Middleware para lidar com erros de validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para criar um novo CargoExercido
export const createCargoExercidoRules = () => {
  return [
    body('nomeCargo')
      .trim()
      .notEmpty().withMessage('O nome do cargo é obrigatório.')
      .isIn(NOME_CARGO_ENUM_VALUES).withMessage('O valor fornecido para "nomeCargo" não é um cargo válido.'),
    body('dataInicio')
      .notEmpty().withMessage('A data de início é obrigatória.')
      .isISO8601().withMessage('Data de início deve estar no formato YYYY-MM-DD.')
      .toDate(), // Converte para objeto Date do JavaScript
    body('dataTermino')
      .optional({ nullable: true, checkFalsy: true }) // Permite nulo ou string vazia para não validar
      .isISO8601().withMessage('Data de término deve estar no formato YYYY-MM-DD, se fornecida.')
      .toDate()
      .custom((value, { req }) => {
        if (value && req.body.dataInicio) { // Só valida se ambas as datas estiverem presentes
          if (new Date(value) < new Date(req.body.dataInicio)) {
            throw new Error('A data de término não pode ser anterior à data de início.');
          }
        }
        return true;
      }),
    // lodgeMemberId virá da URL (:lodgeMemberId) e será validado pela lodgeMemberIdParamRule nas rotas
  ];
};

// Regras para atualizar um CargoExercido
export const updateCargoExercidoRules = () => {
  return [
    body('nomeCargo')
      .optional() // Todos os campos são opcionais na atualização
      .trim()
      .notEmpty().withMessage('O nome do cargo não pode ser uma string vazia se fornecido.')
      .isIn(NOME_CARGO_ENUM_VALUES).withMessage('O valor fornecido para "nomeCargo" não é um cargo válido.'),
    body('dataInicio')
      .optional()
      .isISO8601().withMessage('Data de início deve estar no formato YYYY-MM-DD, se fornecida.')
      .toDate(),
    body('dataTermino')
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage('Data de término deve estar no formato YYYY-MM-DD, se fornecida.')
      .toDate()
      .custom((value, { req }) => {
        // Pega a data de início do corpo da requisição (se estiver sendo atualizada)
        // ou do cargo existente (se não estiver sendo atualizada a data de início)
        // req.cargoExercidoAnterior deve ser populado no controller antes da validação para este custom check.
        const dataInicioExistente = req.cargoExercidoAnterior ? req.cargoExercidoAnterior.dataInicio : null;
        const dataInicioNova = req.body.dataInicio;
        
        // Determina qual data de início usar para a comparação
        const dataInicioParaComparacao = dataInicioNova ? new Date(dataInicioNova) : (dataInicioExistente ? new Date(dataInicioExistente) : null);

        if (value && dataInicioParaComparacao) {
          if (new Date(value) < dataInicioParaComparacao) {
            throw new Error('A data de término não pode ser anterior à data de início.');
          }
        }
        return true;
      }),
  ];
};

// Regra para validar :lodgeMemberId e :cargoId nos parâmetros da URL
export const cargoParamsRule = () => {
  return [
    param('lodgeMemberId').isInt({ gt: 0 }).withMessage('ID do Maçom na URL deve ser um inteiro positivo.'),
    param('cargoId').isInt({ gt: 0 }).withMessage('ID do Cargo na URL deve ser um inteiro positivo.')
  ];
};

// Regra para validar apenas :lodgeMemberId nos parâmetros da URL
export const lodgeMemberIdParamRule = () => {
  return [
    param('lodgeMemberId').isInt({ gt: 0 }).withMessage('ID do Maçom na URL deve ser um inteiro positivo.')
  ];
};