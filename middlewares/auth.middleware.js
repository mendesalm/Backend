// backend/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import db from '../models/index.js'; // Importa o objeto db
// NÃO desestruture LodgeMember aqui no topo: const { LodgeMember } = db;
import dotenv from 'dotenv';
import path from 'path'; // Para construir o caminho do .env de forma robusta
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajuste o path se seu .env não estiver dois níveis acima (na raiz do projeto SysJPJ/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Nenhum token fornecido, autorização negada.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ message: 'Token mal formatado. Deve ser "Bearer [token]".' });
  }
  const token = parts[1];

  try {
    // Adicione um log para ver o JWT_SECRET que está sendo usado aqui
    // console.log('DEBUG [auth.middleware]: Verificando token com JWT_SECRET:', JWT_SECRET ? 'Definido' : 'UNDEFINED!!!');

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Acessa LodgeMember diretamente do objeto db DENTRO da função
    if (!db.LodgeMember) {
      console.error("MODELO INDEFINIDO: db.LodgeMember não está disponível no auth.middleware.");
      return res.status(500).json({ message: "Erro interno do servidor (modelo de autenticação não pronto)." });
    }
    
    const member = await db.LodgeMember.findByPk(decoded.user.id, {
      attributes: ['id', 'Email', 'NomeCompleto', 'Funcao', 'credencialAcesso']
    });

    if (!member) {
      return res.status(401).json({ message: 'Usuário do token não encontrado ou inválido.' });
    }

    req.user = member.toJSON();
    next();
  } catch (error) {
    // Este log é crucial!
    console.error('Erro na verificação do token no auth.middleware:', error.name, '-', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    if (error.name === 'JsonWebTokenError') { // Cobre 'invalid signature', 'jwt malformed', etc.
      return res.status(401).json({ message: `Token inválido (${error.message})` });
    }
    // Para outros erros (como TypeError se db.LodgeMember falhar por outro motivo)
    return res.status(500).json({ message: 'Falha na autenticação do token devido a erro interno.', errorDetails: error.message });
  }
};

export default authMiddleware;