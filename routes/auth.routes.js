// backend/routes/auth.routes.js
import express from 'express';
// Importa todas as exportações nomeadas do controller como um objeto 'authController'
import * as authController from '../controllers/auth.controller.js'; 
// Importa as funções de validação nomeadas
import {
  registerValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  handleValidationErrors
} from '../validators/auth.validator.js';

// Cria a instância do router
const router = express.Router();

// POST /api/auth/register - Registrar um novo Maçom
router.post(
  '/register',
  registerValidationRules(),
  handleValidationErrors,
  authController.register 
);

// POST /api/auth/login - Autenticar Maçom e obter token
router.post(
  '/login',
  loginValidationRules(), 
  handleValidationErrors, 
  authController.login 
);

// POST /api/auth/forgot-password - Solicitar redefinição de senha
router.post(
  '/forgot-password',
  forgotPasswordValidationRules(), 
  handleValidationErrors,        
  authController.forgotPassword
);

// POST /api/auth/reset-password/:token - Redefinir senha com token
router.post(
  '/reset-password/:token',
  resetPasswordValidationRules(),
  handleValidationErrors,
  authController.resetPassword
);

// Exporta o router como default
export default router; // <<< ESTA LINHA É CRUCIAL
