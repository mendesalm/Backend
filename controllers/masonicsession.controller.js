import db from "../models/index.js";
import { createBalaustreFromTemplate } from "../services/googleDocs.service.js";
import * as ChancelerService from "../services/chanceler.service.js"; // Importa o novo serviço

export const getAllSessions = async (req, res) => {
  try {
    const { sortBy = "dataSessao", order = "DESC", tipoSessao } = req.query;

    const whereClause = {};
    if (tipoSessao) {
      whereClause.tipoSessao = tipoSessao;
    }

    const sessions = await db.MasonicSession.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM SessionAttendees AS presentes
              WHERE
                presentes.sessionId = MasonicSession.id
            )`),
            "presentesCount",
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM VisitantesSessao AS visitantes
              WHERE
                visitantes.masonicSessionId = MasonicSession.id
            )`),
            "visitantesCount",
          ],
        ],
      },
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
      order: [[sortBy, order.toUpperCase()]],
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Erro em getAllSessions:", error);
    res.status(500).json({
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
    res.status(500).json({
      message: "Erro ao buscar detalhes da sessão.",
      errorDetails: error.message,
    });
  }
};

export const createSession = async (req, res) => {
  const { dataSessao, tipoSessao, subtipoSessao, ...restOfBody } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const novaSessao = await db.MasonicSession.create(
      { dataSessao, tipoSessao, subtipoSessao, ...restOfBody },
      { transaction }
    );

    const sessionDate = new Date(dataSessao);

    const dadosParaBalaustre = {
      NumeroBalaustre: novaSessao.id,
      NumeroIrmaosQuadro: 0,
      NumeroVisitantes: 0,
      ClasseSessao: `${tipoSessao} de ${subtipoSessao}`,
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

    const { googleDocId, pdfPath } = await createBalaustreFromTemplate(
      dadosParaBalaustre
    );

    await db.Balaustre.create(
      {
        numero: novaSessao.id.toString(),
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
    res.status(500).json({
      message: "Erro ao criar sessão e balaústre automático.",
      errorDetails: error.message,
    });
  }
};

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
    res.status(500).json({
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
    res.status(500).json({
      message: "Erro ao deletar sessão.",
      errorDetails: error.message,
    });
  }
};
// --- NOVA FUNÇÃO PARA LISTAR PRESENTES ---
export const getSessionAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await db.MasonicSession.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "presentes",
          attributes: ["id"], // Pega apenas o ID dos membros presentes
          through: { attributes: [] },
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // Mapeia o resultado para retornar apenas um array de IDs
    const presentesIds = session.presentes
      ? session.presentes.map((membro) => membro.id)
      : [];

    res.status(200).json(presentesIds);
  } catch (error) {
    console.error("Erro ao buscar lista de IDs de presentes:", error);
    res.status(500).json({
      message: "Erro ao buscar lista de presentes.",
      errorDetails: error.message,
    });
  }
};
export const setSessionAttendees = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { presentMemberIds } = req.body;

    const session = await db.MasonicSession.findByPk(id, { transaction: t });
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // O método 'setPresentes' do Sequelize lida com a remoção de antigos
    // e adição de novos presentes de forma atômica. É a maneira mais segura.
    await session.setPresentes(presentMemberIds, { transaction: t });

    await t.commit();
    res
      .status(200)
      .json({ message: "Lista de presença atualizada com sucesso." });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao salvar lista de presentes:", error);
    res
      .status(500)
      .json({
        message: "Erro ao salvar lista de presentes.",
        errorDetails: error.message,
      });
  }
};
// --- NOVA FUNÇÃO PARA O PAINEL DO CHANCELER ---
export const getPainelChanceler = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataFim } = req.query;

    if (!dataFim) {
      return res
        .status(400)
        .json({ message: "O parâmetro 'dataFim' é obrigatório." });
    }

    // Delega toda a lógica de busca para a camada de serviço
    const panelData = await ChancelerService.getPanelData(id, dataFim);

    res.status(200).json(panelData);
  } catch (error) {
    console.error("Erro ao buscar dados do painel do Chanceler:", error);
    // Trata erros comuns como 'não encontrado' de forma amigável
    if (error.message.includes("não encontrada")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message: "Erro interno ao processar a solicitação.",
      errorDetails: error.message,
    });
  }
};
