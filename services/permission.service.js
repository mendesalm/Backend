// services/permission.service.js
import db from '../models/index.js';

// Retorna uma lista de todos os nomes de funcionalidades que um utilizador pode aceder
export const getAllowedFeaturesForUser = async (user) => {
  if (!user || !user.id) return [];

  const { credencialAcesso, id: userId } = user;

  // 1. Obter todos os cargos ativos do utilizador
  const userActiveCargos = await db.CargoExercido.findAll({
    where: { lodgeMemberId: userId, dataTermino: null },
    attributes: ['nomeCargo'],
    raw: true,
  });
  const userActiveCargoNames = userActiveCargos.map(cargo => cargo.nomeCargo);

  // 2. Obter todas as funcionalidades do banco de dados
  const todasAsFuncionalidades = await db.FuncionalidadePermissao.findAll({ raw: true });

  // 3. Filtrar as funcionalidades permitidas
  const funcionalidadesPermitidas = todasAsFuncionalidades.filter(func => {
    // Verifica se a credencial do utilizador está na lista de credenciais permitidas
    if (func.credenciaisPermitidas && func.credenciaisPermitidas.includes(credencialAcesso)) {
      return true;
    }
    // Verifica se algum dos cargos ativos do utilizador está na lista de cargos permitidos
    if (func.cargosPermitidos && userActiveCargoNames.some(cargo => func.cargosPermitidos.includes(cargo))) {
      return true;
    }
    return false;
  });

  return funcionalidadesPermitidas.map(func => func.nomeFuncionalidade);
};
