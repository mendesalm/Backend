import db from "../models/index.js";
import { createBalaustreFromTemplate } from "../services/googleDocs.service.js";

// ... as funções getAllSessions e getSessionById permanecem as mesmas ...

export const getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "dataSessao",
      order = "DESC",
      tipoSessao,
    } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const whereClause = {};
    if (tipoSessao) {
      whereClause.tipoSessao = tipoSessao;
    }

    const { count, rows } = await db.MasonicSession.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Balaustre,
          as: "Balaustre",
          attributes: [
            "id",
            "googleDocId",
            "caminhoPdfLocal",
            "numero",
            "ano",
            "path",
          ],
          required: false,
        },
      ],
      limit: parseInt(limit, 10),
      offset,
      order: [[sortBy, order.toUpperCase()]],
    });

    const sessionsWithCounts = await Promise.all(
      rows.map(async (session) => {
        const presentesCount = await db.SessionAttendee.count({
          where: { sessionId: session.id },
        });
        const visitantesCount = await db.VisitanteSessao.count({
          where: { masonicSessionId: session.id },
        });
        return {
          ...session.toJSON(),
          presentesCount,
          visitantesCount,
        };
      })
    );

    res.status(200).json({
      data: sessionsWithCounts,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    console.error("Erro em getAllSessions:", error);
    res
      .status(500)
      .json({
        message: "Erro ao listar sessões maçónicas.",
        errorDetails: error.message,
      });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await db.MasonicSession.findByPk(req.params.id, {
      include: [
        { model: db.Balaustre, as: "Balaustre", required: false },
        {
          model: db.LodgeMember,
          as: "presentes",
          attributes: ["id", "NomeCompleto"],
          through: { attributes: [] },
        },
        {
          model: db.VisitanteSessao,
          as: "visitantes",
          attributes: ["id", "nomeCompleto", "graduacao", "loja"],
        },
      ],
    });
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error("Erro em getSessionById:", error);
    res
      .status(500)
      .json({
        message: "Erro ao buscar detalhes da sessão.",
        errorDetails: error.message,
      });
  }
};

// Criar uma nova sessão (Lógica de dados para o template ATUALIZADA)
export const createSession = async (req, res) => {
  const { dataSessao, tipoSessao, subtipoSessao, ...restOfBody } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const novaSessao = await db.MasonicSession.create(
      { dataSessao, tipoSessao, subtipoSessao, ...restOfBody },
      { transaction }
    );

    const sessionDate = new Date(dataSessao);

    // --- CORREÇÃO APLICADA ---
    const dadosParaBalaustre = {
      NumeroBalaustre: novaSessao.id, // Envia apenas o número
      NumeroIrmaosQuadro: 0, // Valor inicial, será editado depois
      NumeroVisitantes: 0, // Valor inicial, será editado depois
      ClasseSessao: `${tipoSessao} de ${subtipoSessao}`, // O service cuidará de criar as versões _Titulo e _Corpo
      DiaSessao: sessionDate.toLocaleDateString("pt-BR", {
        dateStyle: "long",
        timeZone: "UTC",
      }),
      DataSessaoAnterior: "(A preencher)",
      HoraInicioSessao: "19h30",
      HoraEncerramento: "(A preencher)",
      EmendasBalaustreAnterior: "Sem",
      DataAssinatura: `Anápolis-Goiás, ${sessionDate.toLocaleDateString(
        "pt-BR",
        { dateStyle: "long", timeZone: "UTC" }
      )}`,
      Veneravel: "(A preencher)",
      PrimeiroVigilante: "(A preencher)",
      SegundoVigilante: "(A preencher)",
      Orador: "(A preencher)",
      Secretario: "(A preencher)",
      Tesoureiro: "(A preencher)",
      Chanceler: "(A preencher)",
      ExpedienteRecebido: "(A preencher)",
      ExpedienteExpedido: "(A preencher)",
      SacoProposta: "(A preencher)",
      OrdemDia: "(A preencher)",
      TempoInstrucao: "(A preencher)",
      TroncoBeneficiencia: "0",
      Palavra: "(A preencher)",
      Emendas: "(A preencher)",
    };
    // --- FIM DA CORREÇÃO ---

    const { googleDocId, pdfPath } = await createBalaustreFromTemplate(
      dadosParaBalaustre
    );

    await db.Balaustre.create(
      {
        numero: novaSessao.id.toString(), // Salva o número como string
        ano: sessionDate.getFullYear(),
        path: pdfPath,
        MasonicSessionId: novaSessao.id,
        googleDocId: googleDocId,
        caminhoPdfLocal: pdfPath,
        dadosFormulario: dadosParaBalaustre,
      },
      { transaction }
    );

    await transaction.commit();

    const sessaoCompleta = await db.MasonicSession.findByPk(novaSessao.id, {
      include: [{ model: db.Balaustre, as: "Balaustre" }],
    });

    const finalObject = {
      ...sessaoCompleta.toJSON(),
      presentesCount: 0,
      visitantesCount: 0,
    };

    res.status(201).json(finalObject);
  } catch (error) {
    await transaction.rollback();
    console.error("Erro em createSession:", error);
    res
      .status(500)
      .json({
        message: "Erro ao criar sessão e balaústre automático.",
        errorDetails: error.message,
      });
  }
};

// ... as funções updateSession e deleteSession permanecem as mesmas ...
export const updateSession = async (req, res) => {
  const { id } = req.params;
  const { dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia } =
    req.body;
  try {
    const session = await db.MasonicSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
    await session.update({
      dataSessao,
      tipoSessao,
      subtipoSessao,
      troncoDeBeneficencia,
    });
    res.status(200).json(session);
  } catch (error) {
    console.error("Erro em updateSession:", error);
    res
      .status(500)
      .json({
        message: "Erro ao atualizar sessão.",
        errorDetails: error.message,
      });
  }
};

export const deleteSession = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await db.MasonicSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
    await session.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Erro em deleteSession:", error);
    res
      .status(500)
      .json({
        message: "Erro ao deletar sessão.",
        errorDetails: error.message,
      });
  }
};
