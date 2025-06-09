// backend/validators/familyMember.validator.js
import { body, param, validationResult } from 'express-validator';
import { isValidTelefone } from '../utils/validationHelpers.js';
import db from '../models/index.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const familyMemberRules = (isUpdate = false) => {
  let nomeCompletoValidation = body('nomeCompleto').trim();
  let parentescoValidation = body('parentesco').trim(); // Adicionado trim
  let dataNascimentoValidation = body('dataNascimento');

  if (!isUpdate) { // Regras para criação
    nomeCompletoValidation = nomeCompletoValidation
      .notEmpty().withMessage('O nome completo do familiar é obrigatório.');
    
    parentescoValidation = parentescoValidation
      .notEmpty().withMessage('Parentesco é obrigatório.');

    dataNascimentoValidation = dataNascimentoValidation
      .notEmpty().withMessage('Data de nascimento é obrigatória.');
  } else { // Regras para atualização (opcional, mas se fornecido, não pode ser só espaços)
    nomeCompletoValidation = nomeCompletoValidation
      .optional()
      .custom((value, { req }) => {
        if (req.body.nomeCompleto !== undefined && req.body.nomeCompleto.trim() === '') {
            throw new Error('O nome completo não pode ser apenas espaços em branco se fornecido.');
        }
        return true;
      });

    parentescoValidation = parentescoValidation.optional();
    dataNascimentoValidation = dataNascimentoValidation.optional({ checkFalsy: true });
  }

  // Regras comuns ou que continuam após a condicional
  nomeCompletoValidation = nomeCompletoValidation
    .isLength({ min: 3 }).withMessage('O nome completo deve ter pelo menos 3 caracteres se fornecido.');

  parentescoValidation = parentescoValidation
    .isIn(['cônjuge', 'filho', 'filha']).withMessage('Parentesco deve ser cônjuge, filho ou filha, se fornecido.');
  
  dataNascimentoValidation = dataNascimentoValidation
    .isISO8601().withMessage('Data de nascimento deve estar no formato YYYY-MM-DD, se fornecida.')
    .toDate()
    .custom((value) => {
      if (value) { 
        const today = new Date(); 
        today.setHours(0,0,0,0);
        if (new Date(value) >= today) {
          throw new Error('A data de nascimento deve ser anterior à data atual.');
        }
      }
      return true;
    });

  return [
    nomeCompletoValidation,
    parentescoValidation,
    dataNascimentoValidation,

    body('email')
      .optional({ checkFalsy: true }) 
      .trim()
      .isEmail().withMessage('Formato de email inválido para o familiar.')
      .normalizeEmail()
      .custom(async (value, { req }) => {
        if (!value) return true; 
        const { FamilyMember, Sequelize } = db; 
        if (!FamilyMember || !Sequelize || !Sequelize.Op) throw new Error('Dependências de modelo ou Sequelize não inicializadas para validação de email.');
        
        const whereClause = { email: value };
        if (isUpdate && req.params && req.params.id) {
          const { Op } = Sequelize;
          whereClause.id = { [Op.ne]: parseInt(req.params.id, 10) };
        }
        const existingFamilyMember = await FamilyMember.findOne({ where: whereClause });
        if (existingFamilyMember) {
          throw new Error('Este email já está em uso por outro familiar.');
        }
        return true;
      }),

    body('telefone')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value) => {
        if (value && !isValidTelefone(value)) { // isValidTelefone deve estar em validationHelpers.js
          throw new Error('Formato de telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.');
        }
        return true;
      }),
  ];
};

export const familyMemberIdParamRule = () => {
  return [
    param('id').isInt({ gt: 0 }).withMessage('ID do familiar na URL deve ser um inteiro positivo.')
  ];
};
