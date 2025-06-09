// backend/validators/lodgemember.validator.js
import { body, param, validationResult } from 'express-validator';
import db from '../models/index.js';
// const { LodgeMember } = db; // Descomentado e usado abaixo
import { isValidCPF, isValidTelefone } from '../utils/validationHelpers.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const updateMyProfileRules = () => {
  return [ // Certifique-se que este array está sendo retornado
    body('NomeCompleto')
      .optional().trim().notEmpty().withMessage('Nome completo não pode ser vazio se fornecido.')
      .isLength({ min: 3 }).withMessage('Nome completo deve ter pelo menos 3 caracteres.'),
    body('Email')
      .optional({ checkFalsy: true }) // Só valida se fornecido e não for string vazia/null
      .isEmail().withMessage('Formato de email inválido.')
      .normalizeEmail()
      .custom(async (value, { req }) => {
        if (!value) return true; 
        const { LodgeMember } = db; // Acessa o modelo aqui
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação de Email.');
        const member = await LodgeMember.findOne({ where: { Email: value } });
        if (member && member.id !== req.user.id) { 
          throw new Error('Este email já está em uso por outra conta.');
        }
        return true;
      }),
    body('CIM')
      .optional({ checkFalsy: true }).trim()
      .notEmpty().withMessage('CIM não pode ser vazio se fornecido.')
      .custom(async (value, { req }) => {
        if (!value) return true;
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação de CIM.');
        const member = await LodgeMember.findOne({ where: { CIM: value } });
        if (member && member.id !== req.user.id) {
          throw new Error('Este CIM já está em uso por outra conta.');
        }
        return true;
      }),
    body('Identidade').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Identidade não pode ser vazia se fornecida.'),
    body('DataNascimento')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Data de nascimento deve estar no formato YYYY-MM-DD.')
      .toDate()
      .custom((value) => {
        if (value) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          if (new Date(value) >= today) {
            throw new Error('A data de nascimento deve ser anterior à data atual.');
          }
        }
        return true;
      }),
    body('Telefone')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value) => {
        if (value && !isValidTelefone(value)) {
          throw new Error('Formato de telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.');
        }
        return true;
      }),
    body('FotoPessoal_Caminho').optional({ checkFalsy: true }).trim().isURL({require_protocol: true, require_host: true}).withMessage('URL da foto inválida.'),
    body('DataCasamento').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Data de casamento inválida.'),
    body('Endereco_CEP').optional({ checkFalsy: true }).trim().isLength({min: 8, max: 9}).withMessage('CEP deve ter 8 ou 9 caracteres.'), 
    body('grauFilosofico').optional({ checkFalsy: true }).trim(),
    body('Endereco_Rua').optional({ checkFalsy: true }).trim(),
    body('Endereco_Numero').optional({ checkFalsy: true }).trim(),
    body('Endereco_Bairro').optional({ checkFalsy: true }).trim(),
    body('Endereco_Cidade').optional({ checkFalsy: true }).trim(),
    body('Naturalidade').optional({ checkFalsy: true }).trim(),
    body('Nacionalidade').optional({ checkFalsy: true }).trim(),
    body('Religiao').optional({ checkFalsy: true }).trim(),
    body('NomePai').optional({ checkFalsy: true }).trim(),
    body('NomeMae').optional({ checkFalsy: true }).trim(),
    body('FormacaoAcademica').optional({ checkFalsy: true }).trim(),
    body('Ocupacao').optional({ checkFalsy: true }).trim(),
    body('LocalTrabalho').optional({ checkFalsy: true }).trim(),
  ];
};

export const createLodgeMemberRules = () => { 
  return [
    body('NomeCompleto').trim().notEmpty().withMessage('Nome completo é obrigatório.').isLength({ min: 3 }),
    body('Email').isEmail().withMessage('Email inválido.').normalizeEmail()
      .custom(async (value) => {
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação.');
        const member = await LodgeMember.findOne({ where: { Email: value } });
        if (member) throw new Error('Este email já está em uso.');
        return true;
      }),
    body('CPF').trim().notEmpty().withMessage('CPF é obrigatório.')
      .custom(async (value) => {
        const cpfLimpo = value.replace(/[^\d]+/g, '');
        if (!isValidCPF(cpfLimpo)) throw new Error('CPF inválido.');
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação.');
        const member = await LodgeMember.findOne({ where: { CPF: cpfLimpo } });
        if (member) throw new Error('Este CPF já está em uso.');
        return true;
      }),
    body('SenhaHash')
      .notEmpty().withMessage('Senha é obrigatória.')
      .isLength({ min: 8, max: 100 }).withMessage('A senha deve ter entre 8 e 100 caracteres.')
      .matches(/\d/).withMessage('A senha deve conter pelo menos um número.')
      .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
      .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('A senha deve conter pelo menos um caractere especial.'),
    body('credencialAcesso')
      .notEmpty().withMessage('Credencial de acesso é obrigatória.')
      .isIn(['Webmaster', 'Diretoria', 'Membro']).withMessage('Credencial de acesso inválida.'),
    body('Graduacao')
      .optional({ checkFalsy: true })
      .isIn(['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado']).withMessage('Graduação inválida.'),
    body('DataNascimento').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Data de nascimento inválida.')
      .custom((value) => {
        if (value) {
          const today = new Date(); today.setHours(0,0,0,0);
          if (new Date(value) >= today) throw new Error('A data de nascimento deve ser anterior à data atual.');
        }
        return true;
      }),
    body('Telefone')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value) => {
        if (value && !isValidTelefone(value)) {
          throw new Error('Formato de telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.');
        }
        return true;
      }),
  ];
};

export const updateLodgeMemberByAdminRules = () => { 
  return [
    param('id').isInt({ gt: 0 }).withMessage('ID do maçom no parâmetro da URL deve ser um inteiro positivo.'),
    body('NomeCompleto').optional().trim().notEmpty().withMessage('Nome completo não pode ser vazio se fornecido.').isLength({ min: 3 }),
    body('Email').optional().isEmail().withMessage('Email inválido.').normalizeEmail()
      .custom(async (value, { req }) => {
        if(!value) return true;
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação.');
        const member = await LodgeMember.findOne({ where: { Email: value } });
        if (member && member.id !== parseInt(req.params.id, 10)) {
          throw new Error('Este email já está em uso por outra conta.');
        }
        return true;
      }),
    body('CPF').optional().trim().notEmpty().withMessage('CPF não pode ser vazio se fornecido.')
      .custom(async (value, { req }) => {
        if(!value) return true;
        const cpfLimpo = value.replace(/[^\d]+/g, '');
        if (!isValidCPF(cpfLimpo)) throw new Error('CPF inválido.');
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação.');
        const member = await LodgeMember.findOne({ where: { CPF: cpfLimpo } });
        if (member && member.id !== parseInt(req.params.id, 10)) {
          throw new Error('Este CPF já está em uso por outra conta.');
        }
        return true;
      }),
    body('credencialAcesso')
      .optional()
      .isIn(['Webmaster', 'Diretoria', 'Membro']).withMessage('Credencial de acesso inválida.'),
    body('Graduacao')
      .optional({ checkFalsy: true })
      .isIn(['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado']).withMessage('Graduação inválida.'),
    body('Situacao').optional({ checkFalsy: true }).trim(),
    body('grauFilosofico').optional({ checkFalsy: true }).trim(),
  ];
};

export const lodgeMemberIdParamRule = () => { 
  return [
    param('id').isInt({ gt: 0 }).withMessage('ID do maçom na URL deve ser um inteiro positivo.')
  ];
};
