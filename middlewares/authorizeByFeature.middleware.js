// backend/middlewares/authorizeByFeature.middleware.js
import db from '../models/index.js'; // Garanta que FuncionalidadePermissao é carregado em db

export const authorizeByFeature = (featureName) => {
  return async (req, res, next) => {
    // 1. Verificações básicas do usuário autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Acesso não autorizado. Usuário não autenticado.' });
    }

    const userCredencial = req.user.credencialAcesso;
    if (!userCredencial) {
      console.warn(`[AuthByFeature] Maçom ID ${req.user.id} não possui 'credencialAcesso' definida.`);
      return res.status(403).json({ message: 'Acesso negado. Credencial de acesso não definida.' });
    }

    // 2. Verificar se o modelo de permissões está disponível
    if (!db.FuncionalidadePermissao) {
        console.error("[AuthByFeature] MODELO AUSENTE: FuncionalidadePermissao não carregado no objeto db.");
        return res.status(500).json({ message: "Erro de configuração de autorização interna." });
    }
    if (db.CargoExercido && typeof db.CargoExercido.findAll !== 'function') { // Checagem adicional para CargoExercido se for usar
        console.error("[AuthByFeature] MODELO AUSENTE ou INVÁLIDO: CargoExercido não está corretamente disponível no objeto db.");
        // Considerar se deve falhar ou prosseguir apenas com credenciais
    }


    try {
      // 3. Buscar a configuração de permissão para a funcionalidade
      const permissaoConfig = await db.FuncionalidadePermissao.findOne({
        where: { nomeFuncionalidade: featureName },
      });

      if (!permissaoConfig) {
        console.warn(`[AuthByFeature] Nenhuma configuração de permissão encontrada para a funcionalidade: '${featureName}'. Acesso negado por padrão.`);
        // Em um sistema em produção, você pode querer que funcionalidades não configuradas neguem acesso por padrão.
        // Ou, poderia ter uma lista de funcionalidades que permitem acesso a todos os 'Membro' por default se não configuradas.
        return res.status(403).json({ message: `Acesso negado. Funcionalidade '${featureName}' não configurada ou sem permissões definidas.` });
      }

      // 4. Verificar credenciais de acesso
      const allowedCredentials = permissaoConfig.credenciaisPermitidas || []; // credenciaisPermitidas é um array JSON no modelo
      if (allowedCredentials.includes(userCredencial)) {
        console.log(`[AuthByFeature] Acesso permitido para '${req.user.Email}' à funcionalidade '${featureName}' via credencial '${userCredencial}'.`);
        return next();
      }

      // 5. Verificar cargos permitidos (se houver cargos configurados para a funcionalidade E o modelo CargoExercido estiver disponível)
      const allowedCargos = permissaoConfig.cargosPermitidos || []; // cargosPermitidos é um array JSON
      if (allowedCargos.length > 0 && db.CargoExercido && typeof db.CargoExercido.findAll === 'function') {
        const userActiveCargos = await db.CargoExercido.findAll({
          where: {
            lodgeMemberId: req.user.id,
            dataTermino: null, // Apenas cargos ativos
          },
          attributes: ['nomeCargo'],
        });

        const userActiveCargoNames = userActiveCargos.map(cargo => cargo.nomeCargo);

        const hasRequiredCargo = userActiveCargoNames.some(userCargo => allowedCargos.includes(userCargo));
        if (hasRequiredCargo) {
          console.log(`[AuthByFeature] Acesso permitido para '${req.user.Email}' à funcionalidade '${featureName}' via cargo.`);
          return next();
        }
      }

      // 6. Se chegou aqui, o acesso é negado
      console.warn(`[AuthByFeature] Acesso NEGADO para '${req.user.Email}' à funcionalidade '${featureName}'. Credencial: '${userCredencial}'. Cargos não suficientes.`);
      return res.status(403).json({ message: `Acesso negado. Você não tem as permissões (credencial ou cargo) necessárias para '${featureName}'.` });

    } catch (error) {
      console.error(`[AuthByFeature] Erro ao verificar permissão para funcionalidade '${featureName}':`, error);
      return res.status(500).json({ message: 'Erro interno do servidor ao verificar permissões.' });
    }
  };
};