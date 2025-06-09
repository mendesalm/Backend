import { body, param, validationResult } from 'express-validator';
import db from '../models/index.js';

// Lista de todas as credenciais de acesso válidas no sistema (do ENUM em LodgeMember)
const VALID_CREDENCIAIS = ['Webmaster', 'Diretoria', 'Membro'];
// Lista de todos os cargos válidos no sistema (do ENUM em CargoExercido)
const VALID_CARGOS = [
  "Venerável Mestre", "Primeiro Vigilante", "Segundo Vigilante", "Orador", "Orador Adjunto",
  "Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Tesoureiro", "Tesoureiro Adjunto",
  "Mestre de Cerimônias", "Mestre de Harmonia", "Mestre de Harmonia Adjunto",
  "Arquiteto", "Arquiteto Adjunto", "Bibliotecário", "Bibliotecário Adjunto",
  "Primeiro Diácono", "Segundo Diácono", "Primeiro Experto", "Segundo Experto",
  "Cobridor Interno", "Cobridor Externo", "Hospitaleiro", "Porta Bandeira",
  "Porta Estandarte", "Deputado Estadual", "Deputado Federal", "Sem cargo definido"
];


export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const funcionalidadePermissaoValidator = [
  body('nomeFuncionalidade')
    .trim()
    .notEmpty().withMessage('O nome da funcionalidade é obrigatório.')
    .isLength({ min: 3, max: 100 }).withMessage('O nome da funcionalidade deve ter entre 3 e 100 caracteres.'),

  body('descricao')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('A descrição não pode exceder 500 caracteres.'),

  body('credenciaisPermitidas')
    .optional({ checkFalsy: true }) // Permite array vazio ou ausente
    .isArray().withMessage('Credenciais permitidas deve ser um array.')
    .custom((value) => {
      if (value && value.some(cred => !VALID_CREDENCIAIS.includes(cred))) {
        throw new Error(`Credenciais permitidas contém valores inválidos. Válidos: ${VALID_CREDENCIAIS.join(', ')}`);
      }
      return true;
    }),
  // Garante que, se enviado, mesmo vazio, seja transformado em array para o setter do modelo.
  // O setter no modelo já trata a sanitização e remoção de duplicatas.
  body('credenciaisPermitidas').customSanitizer(value => {
    if (value === undefined || value === null) return []; // Default para array vazio se não fornecido
    if (!Array.isArray(value)) return []; // Se não for array, retorna vazio (deve ser pego pelo .isArray() acima)
    return value;
  }),


  body('cargosPermitidos')
    .optional({ nullable: true, checkFalsy: true }) // Permite array vazio, nulo ou ausente
    .isArray().withMessage('Cargos permitidos deve ser um array.')
    .custom((value) => {
      if (value && value.some(cargo => !VALID_CARGOS.includes(cargo))) {
        throw new Error(`Cargos permitidos contém valores inválidos. Verifique a lista de cargos oficiais.`);
      }
      return true;
    }),
  body('cargosPermitidos').customSanitizer(value => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) return [];
    return value;
  }),

  handleValidationErrors,
];

export const nomeFuncionalidadeParamValidator = [
  param('nomeFuncionalidade')
    .trim()
    .notEmpty().withMessage('O nome da funcionalidade no parâmetro da URL é obrigatório.'),
  handleValidationErrors,
];