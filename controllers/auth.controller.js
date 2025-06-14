import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../models/index.js";
import sendEmail from "../utils/emailSender.js";
import { promisify } from "util"; // Importa o utilitário do Node.js

// Assegura que as variáveis de ambiente foram carregadas.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "60m"; // Duração curta para o Access Token
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`; // Um segredo diferente para o Refresh Token
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d"; // Duração longa para o Refresh Token
const APP_NAME = process.env.APP_NAME || "SysJPJ";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Verificação de segurança: A aplicação não deve iniciar sem uma chave secreta.
if (!JWT_SECRET) {
  console.error(
    "ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida."
  );
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
      NomeCompleto,
      Email,
      CPF,
      SenhaHash,
      ...otherData,
      statusCadastro: "Pendente",
      credencialAcesso: "Membro",
    });
    const { SenhaHash: removedPass, ...memberResponse } = newMember.toJSON();
    res.status(201).json({
      message:
        "Solicitação de cadastro recebida! Será notificado após a aprovação.",
      member: memberResponse,
    });
  } catch (error) {
    console.error("Erro na solicitação de registro:", error);
    res
      .status(500)
      .json({ message: "Erro no servidor ao solicitar o cadastro." });
  }
};

// Função de Login refatorada com async/await para gerar ambos os tokens
export const login = async (req, res) => {
  const { Email, password } = req.body;
  try {
    const member = await db.LodgeMember.findOne({ where: { Email } });

    if (!member || !(await member.isValidPassword(password))) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    if (member.statusCadastro !== "Aprovado") {
      return res.status(403).json({
        message: `A sua conta está com o status '${member.statusCadastro}'. Por favor, aguarde a aprovação.`,
      });
    }

    await member.update({ UltimoLogin: new Date() });

    const userPayload = {
      id: member.id,
      Email: member.Email,
      NomeCompleto: member.NomeCompleto,
      credencialAcesso: member.credencialAcesso,
    };

    // Gera ambos os tokens
    const [accessToken, refreshToken] = await Promise.all([
      jwt.sign({ user: userPayload }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      }),
      jwt.sign({ user: { id: member.id } }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
      }),
    ]);

    const {
      SenhaHash,
      resetPasswordToken,
      resetPasswordExpires,
      ...userResponse
    } = member.toJSON();

    res.json({
      message: "Login bem-sucedido!",
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error("Erro no processo de login:", error);
    res
      .status(500)
      .json({ message: "Erro no servidor ao tentar fazer login." });
  }
};

// Nova função para renovar o token
export const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Refresh token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

    const member = await db.LodgeMember.findByPk(decoded.user.id);
    if (!member) {
      return res.status(403).json({ message: "Usuário do token inválido." });
    }

    const userPayload = {
      id: member.id,
      Email: member.Email,
      NomeCompleto: member.NomeCompleto,
      credencialAcesso: member.credencialAcesso,
    };

    const newAccessToken = await jwt.sign({ user: userPayload }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Erro ao renovar token:", error.name);
    return res
      .status(403)
      .json({ message: "Refresh token inválido ou expirado." });
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
