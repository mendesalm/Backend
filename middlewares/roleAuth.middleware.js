// backend/middlewares/roleAuth.middleware.js

/**
 * Middleware para autorizar acesso baseado na credencial do usuário.
 * @param {string[]} allowedCredentials - Array de credenciais permitidas (ex: ['Webmaster', 'Diretoria']).
 */
export const authorize = (allowedCredentials) => { // Exporta uma função nomeada
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Acesso não autorizado. Usuário não autenticado.' });
    }

    const { credencialAcesso } = req.user; // Vem do authMiddleware

    if (!credencialAcesso) {
        console.warn(`Maçom ID ${req.user.id} não possui 'credencialAcesso' definida em req.user.`);
        return res.status(403).json({ message: 'Acesso negado. Credencial de acesso não definida para o usuário.' });
    }

    if (Array.isArray(allowedCredentials) && allowedCredentials.includes(credencialAcesso)) {
      next(); 
    } else {
      res.status(403).json({ message: `Acesso negado. Requer uma das seguintes credenciais: ${allowedCredentials.join(', ')}.` });
    }
  };
};

// Se for a única exportação do arquivo e você preferir default:
// const authorizeFunction = (allowedCredentials) => { ... };
// export default authorizeFunction;
// Mas exportar como nomeado 'authorize' é comum para funções que são fábricas de middleware.