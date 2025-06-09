// backend/validators/masonicsession.validator.js
import { body, param, validationResult } from 'express-validator';
import db from '../models/index.js'; // Para verificar existência de LodgeMember

// Lista de tipos e subtipos de sessão permitidos
const TIPO_SESSAO_ENUM = ['Ordinária', 'Magna'];
const SUBTIPO_SESSAO_ENUM = ['Aprendiz', 'Companheiro', 'Mestre', 'Pública'];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para criar ou atualizar uma MasonicSession
export const sessionRules = (isUpdate = false) => {
  // Helper para tornar campos obrigatórios na criação ou se fornecidos na atualização
  const validateIfNotUpdatingField = (fieldChain, fieldName) => 
    isUpdate ? fieldChain.optional({ checkFalsy: true }) : fieldChain.notEmpty().withMessage(`${fieldName} é obrigatório.`);

  return [
    validateIfNotUpdatingField(body('dataSessao'), 'Data da sessão')
      .isISO8601().withMessage('Data da sessão deve estar no formato YYYY-MM-DD.')
      .toDate(),
    validateIfNotUpdatingField(body('tipoSessao'), 'Tipo de sessão')
      .isIn(TIPO_SESSAO_ENUM).withMessage(`Tipo de sessão inválido. Valores permitidos: ${TIPO_SESSAO_ENUM.join(', ')}.`),
    validateIfNotUpdatingField(body('subtipoSessao'), 'Subtipo de sessão')
      .isIn(SUBTIPO_SESSAO_ENUM).withMessage(`Subtipo de sessão inválido. Valores permitidos: ${SUBTIPO_SESSAO_ENUM.join(', ')}.`),
    
    body('troncoDeBeneficencia')
      .optional({ nullable: true })
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Valor do tronco de beneficência deve ser um número decimal válido (ex: 123.45).')
      .toFloat(),
    body('responsavelJantarLodgeMemberId')
      .optional({ nullable: true })
      .isInt({ gt: 0 }).withMessage('ID do responsável pelo jantar deve ser um inteiro positivo, se fornecido.')
      .custom(async (value) => {
        if (value) {
          const { LodgeMember } = db; // Acessa o modelo dentro do custom validator
          if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação.');
          const member = await LodgeMember.findByPk(value);
          if (!member) throw new Error(`Maçom responsável pelo jantar com ID ${value} não encontrado.`);
        }
        return true;
      }),
    body('conjugeResponsavelJantarNome').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
    
    body('presentesLodgeMemberIds')
      .optional({ nullable: true })
      .isArray().withMessage('A lista de presentes (presentesLodgeMemberIds) deve ser um array.')
      .custom((ids) => {
        if (ids && !ids.every(id => Number.isInteger(parseInt(id,10)) && parseInt(id,10) > 0)) {
          throw new Error('Todos os IDs em presentesLodgeMemberIds devem ser inteiros positivos.');
        }
        return true;
      })
      .custom(async (ids) => { // Validação extra: verificar se os IDs dos membros existem
        if (ids && ids.length > 0) {
            const { LodgeMember } = db;
            if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação de presentes.');
            const count = await LodgeMember.count({ where: { id: ids } });
            if (count !== ids.length) {
                throw new Error('Um ou mais IDs de maçons presentes são inválidos ou não existem.');
            }
        }
        return true;
      }),

    // Validação para Visitantes (array de objetos)
    body('visitantes')
      .optional({ nullable: true })
      .isArray().withMessage('O campo "visitantes" deve ser um array, se fornecido.')
      .custom((visitantesArray) => {
        if (visitantesArray) {
          for (let i = 0; i < visitantesArray.length; i++) {
            const visitante = visitantesArray[i];
            if (!visitante.nomeCompleto || typeof visitante.nomeCompleto !== 'string' || visitante.nomeCompleto.trim() === '') {
              throw new Error(`Visitante na posição ${i + 1} deve ter um "nomeCompleto" (string não vazia).`);
            }
            // Validações opcionais para outros campos do visitante
            if (visitante.graduacao !== undefined && (typeof visitante.graduacao !== 'string' || visitante.graduacao.length > 255)) {
                throw new Error(`Graduação do visitante na posição ${i+1} deve ser uma string com no máximo 255 caracteres, se fornecida.`);
            }
            if (visitante.cim !== undefined && (typeof visitante.cim !== 'string' || visitante.cim.length > 255)) {
                throw new Error(`CIM do visitante na posição ${i+1} deve ser uma string com no máximo 255 caracteres, se fornecido.`);
            }
            if (visitante.potencia !== undefined && (typeof visitante.potencia !== 'string' || visitante.potencia.length > 255)) {
                throw new Error(`Potência do visitante na posição ${i+1} deve ser uma string com no máximo 255 caracteres, se fornecida.`);
            }
            if (visitante.loja !== undefined && (typeof visitante.loja !== 'string' || visitante.loja.length > 255)) {
                throw new Error(`Loja do visitante na posição ${i+1} deve ser uma string com no máximo 255 caracteres, se fornecida.`);
            }
            if (visitante.oriente !== undefined && (typeof visitante.oriente !== 'string' || visitante.oriente.length > 255)) {
                throw new Error(`Oriente do visitante na posição ${i+1} deve ser uma string com no máximo 255 caracteres, se fornecido.`);
            }
          }
        }
        return true;
      }),
      
    // Validações para os campos da Ata, condicionais à presença de req.file ou se estiver atualizando metadados
    body('numeroAta')
      .if((value, { req }) => req.file || (isUpdate && value !== undefined && value !== null && value !== ''))
      .notEmpty().withMessage('O número da ata é obrigatório se um arquivo de ata for fornecido/atualizado.')
      .trim().isLength({max: 50}).withMessage('Número da ata excede 50 caracteres.'),
    body('anoAta')
      .if((value, { req }) => req.file || (isUpdate && value !== undefined && value !== null && value !== ''))
      .notEmpty().withMessage('O ano da ata é obrigatório se um arquivo de ata for fornecido/atualizado.')
      .isInt({ min: 1900, max: new Date().getFullYear() + 5 }).withMessage(`Ano da ata inválido (deve ser entre 1900 e ${new Date().getFullYear() + 5}).`)
      .toInt(),
    body('dataDeAprovacaoAta')
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage('Data de aprovação da ata deve estar no formato YYYY-MM-DD, se fornecida.')
      .toDate(),
  ];
};

// Regra para validar o ID da sessão nos parâmetros da URL
export const sessionIdParamRule = () => {
  return [
    param('id').isInt({ gt: 0 }).withMessage('ID da sessão na URL deve ser um inteiro positivo.')
  ];
};