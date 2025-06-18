import db from "../models/index.js";
import { Op } from "sequelize";

// GET /api/escala - Busca a escala completa de jantares
export const getEscala = async (req, res) => {
  try {
    const escala = await db.EscalaJantar.findAll({
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["id", "NomeCompleto"],
        },
      ],
      order: [["ordem", "ASC"]],
    });
    res.status(200).json(escala);
  } catch (error) {
    console.error("Erro ao buscar escala de jantares:", error);
    res.status(500).json({ message: "Erro ao buscar a escala." });
  }
};

// PUT /api/escala/ordenar - Salva a nova ordem da escala
export const updateOrdemEscala = async (req, res) => {
  // Espera receber um array de IDs na ordem correta, ex: [3, 1, 2]
  const { novaOrdemIds } = req.body;
  if (!novaOrdemIds || !Array.isArray(novaOrdemIds)) {
    return res
      .status(400)
      .json({ message: "Payload inválido. É esperado um array de IDs." });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const updates = novaOrdemIds.map((membroId, index) =>
      db.EscalaJantar.update(
        { ordem: index + 1 },
        { where: { membroId: membroId }, transaction }
      )
    );
    await Promise.all(updates);
    await transaction.commit();
    res
      .status(200)
      .json({ message: "Ordem da escala atualizada com sucesso." });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao atualizar ordem da escala:", error);
    res.status(500).json({ message: "Erro ao salvar a nova ordem." });
  }
};

// GET /api/escala/proximo-responsavel - Busca o próximo da fila e seu cônjuge
export const getProximoResponsavel = async (req, res) => {
  try {
    const ponteiroConfig = await db.Configuracao.findOne({
      where: { chave: "escala_jantar_ponteiro" },
    });
    const proximaOrdem = ponteiroConfig
      ? parseInt(ponteiroConfig.valor, 10)
      : 1;

    const proximoNaEscala = await db.EscalaJantar.findOne({
      where: { ordem: proximaOrdem, status: "ativo" },
    });

    if (!proximoNaEscala) {
      return res
        .status(404)
        .json({
          message:
            "Não foi possível determinar o próximo responsável ativo na escala.",
        });
    }

    const responsavel = await db.LodgeMember.findByPk(
      proximoNaEscala.membroId,
      {
        include: [
          {
            model: db.FamilyMember,
            as: "familiares",
            where: { parentesco: { [Op.in]: ["Cônjuge", "Esposa"] } },
            required: false,
          },
        ],
      }
    );

    const conjuge =
      responsavel.familiares && responsavel.familiares.length > 0
        ? responsavel.familiares[0]
        : null;

    res.status(200).json({
      responsavel: responsavel.NomeCompleto,
      conjuge: conjuge ? conjuge.nomeCompleto : "Não informado",
    });
  } catch (error) {
    console.error("Erro ao buscar próximo responsável:", error);
    res.status(500).json({ message: "Erro ao buscar o próximo responsável." });
  }
};
