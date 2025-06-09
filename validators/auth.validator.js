// backend/validators/auth.validator.js
import { body, validationResult } from 'express-validator';
import db from '../models/index.js'; // Certifique-se que o caminho e a extensão .js estão corretos
// const { LodgeMember } = db; // Descomente e use se precisar de LodgeMember para validações customizadas aqui
import { isValidCPF } from '../utils/validationHelpers.js'; // Certifique-se que o caminho e a extensão .js estão corretos

// Middleware para lidar com erros de validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Regras para o registro de um novo Maçom (LodgeMember)
export const registerValidationRules = () => {
  return [ // Certifique-se de que está retornando o array
    body('NomeCompleto').trim().notEmpty().withMessage('Nome completo é obrigatório.').isLength({ min: 3 }),
    body('Email').isEmail().withMessage('Email inválido.').normalizeEmail()
      .custom(async (value) => {
        const { LodgeMember } = db; 
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação de Email.');
        const member = await LodgeMember.findOne({ where: { Email: value } });
        if (member) {
          throw new Error('Este email já está em uso.');
        }
        return true;
      }),
    body('CPF').trim().notEmpty().withMessage('CPF é obrigatório.')
      .custom(async (value) => {
        const cpfLimpo = value.replace(/[^\d]+/g, '');
        if (!isValidCPF(cpfLimpo)) throw new Error('CPF inválido.');
        const { LodgeMember } = db;
        if (!LodgeMember) throw new Error('Modelo LodgeMember não inicializado para validação de CPF.');
        const member = await LodgeMember.findOne({ where: { CPF: cpfLimpo } });
        if (member) {
          throw new Error('Este CPF já está em uso.');
        }
        return true;
      }),
    body('SenhaHash')
      .notEmpty().withMessage('Senha é obrigatória.')
      .isLength({ min: 8, max: 100 }).withMessage('A senha deve ter entre 8 e 100 caracteres.')
      .matches(/\d/).withMessage('A senha deve conter pelo menos um número.')
      .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
      .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('A senha deve conter pelo menos um caractere especial.'),
    body('confirmarSenha')
      .if(body('SenhaHash').exists({checkFalsy: true}))
      .notEmpty().withMessage('Confirmação de senha é obrigatória.')
      .custom((value, { req }) => {
        if (value !== req.body.SenhaHash) {
          throw new Error('A confirmação de senha não corresponde à senha.');
        }
        return true;
      }),
  ];
};

// Regras para o login
export const loginValidationRules = () => {
  return [ // <<< CORREÇÃO: GARANTIDO QUE RETORNA O ARRAY
    body('Email').isEmail().withMessage('Por favor, insira um email válido.').normalizeEmail(),
    body('password').notEmpty().withMessage('A senha é obrigatória.'),
  ];
};

// Regras para solicitar redefinição de senha
export const forgotPasswordValidationRules = () => {
    return [ // <<< CORREÇÃO: GARANTIDO QUE RETORNA O ARRAY
        body('Email').isEmail().withMessage('Por favor, insira um email válido para redefinição.').normalizeEmail(),
    ];
};

// Regras para redefinir a senha
export const resetPasswordValidationRules = () => {
    return [
        body('novaSenha')
          .notEmpty().withMessage('Nova senha é obrigatória.')
          .isLength({ min: 8, max: 100 }).withMessage('A nova senha deve ter entre 8 e 100 caracteres.')
          .matches(/\d/).withMessage('A nova senha deve conter pelo menos um número.')
          .matches(/[a-z]/).withMessage('A nova senha deve conter pelo menos uma letra minúscula.')
          .matches(/[A-Z]/).withMessage('A nova senha deve conter pelo menos uma letra maiúscula.')
          .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('A nova senha deve conter pelo menos um caractere especial.'),
        body('confirmarNovaSenha')
            .if(body('novaSenha').exists({checkFalsy: true}))
            .notEmpty().withMessage('Confirmação da nova senha é obrigatória.')
            .custom((value, {req}) => {
                if(value !== req.body.novaSenha) {
                    throw new Error('As senhas não coincidem.');
                }
                return true;
            })
    ];
};
