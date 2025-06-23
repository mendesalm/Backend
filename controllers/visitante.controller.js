import db from "../models/index.js";
const { Op, fn, col, literal } = db.Sequelize;

/**
 * Procura por visitantes recorrentes na tabela VisitanteSessao.
 * Retorna uma lista de visitantes únicos, com os dados da sua última visita.
 * A busca é feita por nome completo ou por CIM.
 */
export const searchRecurringVisitors = async (req, res) => {
  const { q } = req.query; // 'q' é o termo da busca

  if (!q || q.length < 3) {
    return res
      .status(400)
      .json({ message: "O termo de busca deve ter no mínimo 3 caracteres." });
  }

  try {
    // Subconsulta para encontrar o ID da última visita de cada visitante único
    const subQuery = `
      SELECT MAX(id)
      FROM VisitantesSessao
      WHERE nomeCompleto LIKE :searchTerm OR cim LIKE :searchTerm
      GROUP BY LOWER(TRIM(nomeCompleto))
    `;

    const latestVisitIds = await db.sequelize.query(subQuery, {
      replacements: { searchTerm: `%${q}%` },
      type: db.Sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // Extrai apenas os IDs do resultado
    const ids = latestVisitIds.map((row) => row["MAX(id)"]);

    if (ids.length === 0) {
      return res.status(200).json([]);
    }

    // Busca os dados completos apenas das últimas visitas encontradas
    const visitantes = await db.VisitanteSessao.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      order: [["nomeCompleto", "ASC"]],
      limit: 15, // Limita a 15 resultados para performance
    });

    res.status(200).json(visitantes);
  } catch (error) {
    console.error("Erro ao buscar visitantes recorrentes:", error);
    res.status(500).json({
      message: "Erro no servidor ao buscar visitantes.",
      errorDetails: error.message,
    });
  }
};
