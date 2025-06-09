import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../models/index.js';
import sendEmail from '../utils/emailSender.js';
import { promisify } from 'util'; // Importa o utilitário do Node.js

// Assegura que as variáveis de ambiente foram carregadas.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const APP_NAME = process.env.APP_NAME || 'SysJPJ';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Verificação de segurança: A aplicação não deve iniciar sem uma chave secreta.
if (!JWT_SECRET) {
  console.error("ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida.");
  process.exit(1);
}

// Converte a função jwt.sign baseada em callback para uma que retorna Promises
const signJwt = promisify(jwt.sign);

// Função para registrar um novo Maçom
export const register = async (req, res) => {
  // ... (a sua função de registo permanece a mesma)
  const { NomeCompleto, Email, CPF, SenhaHash, ...otherData } = req.body;
  try {
    const newMember = await db.LodgeMember.create({
      NomeCompleto, Email, CPF, SenhaHash, ...otherData,
      statusCadastro: 'Pendente',
      credencialAcesso: 'Membro',
    });
    const { SenhaHash: removedPass, ...memberResponse } = newMember.toJSON();
    res.status(201).json({
      message: 'Solicitação de cadastro recebida! Será notificado após a aprovação.',
      member: memberResponse
    });
  } catch (error) {
    console.error('Erro na solicitação de registro:', error);
    res.status(500).json({ message: 'Erro no servidor ao solicitar o cadastro.' });
  }
};

// Função de Login refatorada com async/await
export const login = async (req, res) => {
  const { Email, password } = req.body;
  try {
    const member = await db.LodgeMember.findOne({ where: { Email } });

    if (!member || !(await member.isValidPassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (member.statusCadastro !== 'Aprovado') {
      return res.status(403).json({ message: `A sua conta está com o status '${member.statusCadastro}'. Por favor, aguarde a aprovação.` });
    }

    await member.update({ UltimoLogin: new Date() });

    const payload = {
      user: {
        id: member.id,
        Email: member.Email,
        NomeCompleto: member.NomeCompleto,
        credencialAcesso: member.credencialAcesso,
      },
    };

    // Gera o token usando a versão "promisified" com await
    const token = await signJwt(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    if (!token) {
        // Esta verificação é uma segurança extra
        throw new Error("Erro inesperado: o token gerado é nulo.");
    }
        
    const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...userResponse } = member.toJSON();
    
    res.json({
      message: 'Login bem-sucedido!',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' });
  }
};

// Função para solicitar redefinição de senha
export const forgotPassword = async (req, res) => {
    // ... (a sua função de esqueci a senha permanece a mesma)
};

// Função para redefinir a senha com o token
export const resetPassword = async (req, res) => {
    // ... (a sua função de resetar a senha permanece a mesma)
};
