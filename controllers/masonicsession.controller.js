// backend/controllers/masonicsession.controller.js
import db from "../models/index.js";
import path from "path";
import { Op } from "sequelize";

// --- Serviços ---
import {
  createBalaustreFromTemplate,
  createEditalFromTemplate,
  deleteGoogleFile,
} from "../services/googleDocs.service.js";
import { avancarEscalaSequencialEObterResponsavel } from "../services/escala.service.js";
import { enviarEditalDeConvocacaoPorEmail } from "../services/notification.service.js";

/**
 * Lista todas as sessões, incluindo contagens e dados do responsável pelo jantar.
 */
export const getAllSessions = async (req, res) => {
  try {
    const { sortBy = "dataSessao", order = "DESC", tipoSessao } = req.query;
    const whereClause = {};
    if (tipoSessao) {
      whereClause.tipoSessao = tipoSessao;
    }

    const sessions = await db.MasonicSession.findAll({
      where: whereClause,
      include: [
        {
          model: db.Balaustre,
          as: "Balaustre",
          attributes: ["id", "caminhoPdfLocal", "numero"],
          required: false,
        },
        // CORREÇÃO: Inclui o membro responsável e o seu familiar (cônjuge)
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          required: false,
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Esposa" },
              required: false, // Não exclui a sessão se o membro não tiver esposa cadastrada
            },
          ],
        },
      ],
      order: [[sortBy, order.toUpperCase()]],
    });

    // Mapeia os resultados para adicionar contagens e formatar o nome do cônjuge
    const sessoesFormatadas = await Promise.all(
      sessions.map(async (sessao) => {
        const sessaoJSON = sessao.toJSON();

        const presencas = await db.SessionAttendee.count({
          where: { sessionId: sessao.id, statusPresenca: "Presente" },
        });
        const visitantes = await db.VisitanteSessao.count({
          where: { sessionId: sessao.id },
        });
        sessaoJSON.presentesCount = presencas;
        sessaoJSON.visitantesCount = visitantes;

        if (sessaoJSON.responsavelJantar?.familiares?.length > 0) {
          sessaoJSON.conjugeResponsavelJantarNome =
            sessaoJSON.responsavelJantar.familiares[0].nomeCompleto;
        }

        return sessaoJSON;
      })
    );

    res.status(200).json(sessoesFormatadas);
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

/**
 * Busca os detalhes de uma sessão específica por ID.
 */
export const getSessionById = async (req, res) => {
  try {
    const session = await db.MasonicSession.findByPk(req.params.id, {
      include: [
        { model: db.Balaustre, as: "Balaustre", required: false },
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Esposa" },
              required: false,
            },
          ],
        },
        {
          model: db.SessionAttendee,
          as: "attendees",
          include: [
            {
              model: db.LodgeMember,
              as: "membro",
              attributes: ["id", "NomeCompleto", "CIM", "Graduacao"],
            },
          ],
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

    const sessionJSON = session.toJSON();
    if (sessionJSON.responsavelJantar?.familiares?.length > 0) {
      sessionJSON.conjugeResponsavelJantarNome =
        sessionJSON.responsavelJantar.familiares[0].nomeCompleto;
    }

    res.status(200).json(sessionJSON);
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

/**
 * Cria uma nova sessão, avança a escala e gera documentos.
 */
export const createSession = async (req, res) => {
  const { dataSessao, tipoSessao, subtipoSessao, ...restOfBody } = req.body;

  let novaSessao;
  const transaction = await db.sequelize.transaction();
  try {
    const responsavelJantar = await avancarEscalaSequencialEObterResponsavel(
      transaction
    );
    const tipoResponsabilidade = responsavelJantar
      ? "Sequencial"
      : "Institucional";

    novaSessao = await db.MasonicSession.create(
      {
        dataSessao,
        tipoSessao,
        subtipoSessao,
        responsavelJantarLodgeMemberId: responsavelJantar
          ? responsavelJantar.id
          : null,
        tipoResponsabilidadeJantar: tipoResponsabilidade,
        ...restOfBody,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Erro na transação principal (criação da sessão / avanço da escala):",
      error
    );
    return res
      .status(500)
      .json({
        message: "Falha ao criar o registro da sessão ou avançar a escala.",
        errorDetails: error.message,
      });
  }

  // Operações secundárias (Pós-Transação)
  try {
    const responsavelComFamilia = await db.LodgeMember.findByPk(
      novaSessao.responsavelJantarLodgeMemberId,
      {
        include: [
          {
            model: db.FamilyMember,
            as: "familiares",
            where: { parentesco: "Esposa" },
            required: false,
          },
        ],
      }
    );

    const nomeConjuge =
      responsavelComFamilia?.familiares?.[0]?.nomeCompleto || "não informada";
    const nomeFinalResponsavel = responsavelComFamilia
      ? `${responsavelComFamilia.NomeCompleto} e Cunhada ${nomeConjuge}`
      : "Oferecido pela Loja";

    const sessionDate = new Date(novaSessao.dataSessao);
    const dadosParaTemplate = {
      NumeroBalaustre: novaSessao.id,
      ClasseSessao: `${tipoSessao} de ${subtipoSessao}`,
      DiaSessao: sessionDate.toLocaleDateString("pt-BR", {
        dateStyle: "long",
        timeZone: "UTC",
      }),
      ResponsavelJantar: nomeFinalResponsavel,
      data_sessao_extenso: sessionDate.toLocaleDateString("pt-BR", {
        dateStyle: "long",
        timeZone: "UTC",
      }),
      dia_semana: sessionDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        timeZone: "UTC",
      }),
      hora_sessao: "19h30",
      tipo_sessao: tipoSessao,
      grau_sessao: subtipoSessao,
    };

    const [balaustreInfo, editalInfo] = await Promise.all([
      createBalaustreFromTemplate(dadosParaTemplate),
      createEditalFromTemplate(dadosParaTemplate),
    ]);

    const sessaoParaAtualizar = await db.MasonicSession.findByPk(novaSessao.id);
    await sessaoParaAtualizar.update({
      editalGoogleDocId: editalInfo.googleDocId,
      caminhoEditalPdf: editalInfo.pdfPath,
    });

    await db.Balaustre.create({
      numero: novaSessao.id.toString(),
      ano: sessionDate.getFullYear(),
      path: balaustreInfo.pdfPath,
      MasonicSessionId: novaSessao.id,
      googleDocId: balaustreInfo.googleDocId,
      caminhoPdfLocal: balaustreInfo.pdfPath,
      dadosFormulario: dadosParaTemplate,
    });

    enviarEditalDeConvocacaoPorEmail(
      novaSessao,
      editalInfo.pdfPath.substring(1)
    );

    const sessaoCompleta = await db.MasonicSession.findByPk(novaSessao.id, {
      include: [{ model: db.Balaustre, as: "Balaustre" }],
    });
    res.status(201).json(sessaoCompleta);
  } catch (error) {
    console.error(
      "Erro nas operações secundárias (geração de docs/email):",
      error
    );
    res.status(201).json({
      message:
        "Sessão criada, mas com falha ao gerar documentos ou enviar e-mail.",
      session: novaSessao,
      errorDetails: error.message,
    });
  }
};

/**
 * Atualiza uma sessão maçônica.
 */
export const updateSession = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await db.MasonicSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
    await session.update(req.body);
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

/**
 * Deleta uma sessão maçônica e reverte a escala de jantar.
 */
export const deleteSession = async (req, res) => {
  const { id } = req.params;
  const transaction = await db.sequelize.transaction();
  try {
    const session = await db.MasonicSession.findByPk(id, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    if (
      session.responsavelJantarLodgeMemberId &&
      session.tipoResponsabilidadeJantar === "Sequencial"
    ) {
      const responsavelEntry = await db.ResponsabilidadeJantar.findOne({
        where: {
          lodgeMemberId: session.responsavelJantarLodgeMemberId,
          status: "Cumprido",
        },
        order: [["ordem", "DESC"]],
        transaction,
      });
      if (responsavelEntry) {
        const minOrdemResult = await db.ResponsabilidadeJantar.findOne({
          attributes: [
            [db.sequelize.fn("min", db.sequelize.col("ordem")), "minOrdem"],
          ],
          where: { status: "Ativo", sessaoDesignadaId: null },
          raw: true,
          transaction,
        });
        const novaOrdem = (minOrdemResult.minOrdem || 1) - 1;
        await responsavelEntry.update(
          { status: "Ativo", ordem: novaOrdem },
          { transaction }
        );
      }
    }

    if (session.editalGoogleDocId)
      await deleteGoogleFile(session.editalGoogleDocId);
    const balaustre = await session.getBalaustre({ transaction });
    if (balaustre && balaustre.googleDocId)
      await deleteGoogleFile(balaustre.googleDocId);

    await session.destroy({ transaction });
    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error("Erro em deleteSession:", error);
    res
      .status(500)
      .json({
        message: "Erro ao deletar sessão.",
        errorDetails: error.message,
      });
  }
};

/**
 * Atualiza a lista de presença de uma sessão.
 */
export const updateSessionAttendance = async (req, res) => {
  const { attendees } = req.body;
  const { id } = req.params;
  if (!Array.isArray(attendees)) {
    return res
      .status(400)
      .json({
        message: 'O corpo da requisição deve conter um array de "attendees".',
      });
  }
  const t = await db.sequelize.transaction();
  try {
    for (const attendee of attendees) {
      await db.SessionAttendee.update(
        { statusPresenca: attendee.statusPresenca },
        {
          where: { sessionId: id, lodgeMemberId: attendee.lodgeMemberId },
          transaction: t,
        }
      );
    }
    await t.commit();
    res
      .status(200)
      .json({ message: "Lista de presença atualizada com sucesso." });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar presenças:", error);
    res
      .status(500)
      .json({
        message: "Erro ao atualizar a lista de presença.",
        errorDetails: error.message,
      });
  }
};

/**
 * Gerencia visitantes em uma sessão (adiciona ou atualiza).
 */
export const manageSessionVisitor = async (req, res) => {
  const { id: sessionId } = req.params;
  const { nome, loja, oriente } = req.body;
  try {
    const [visitor] = await db.VisitanteSessao.findOrCreate({
      where: { sessionId, nome },
      defaults: { sessionId, nome, loja, oriente },
    });
    res.status(201).json(visitor);
  } catch (error) {
    console.error("Erro ao adicionar visitante:", error);
    res
      .status(500)
      .json({
        message: "Erro ao adicionar visitante à sessão.",
        errorDetails: error.message,
      });
  }
};

/**
 * Remove um visitante de uma sessão.
 */
export const removeSessionVisitor = async (req, res) => {
  const { visitorId } = req.params;
  try {
    const visitor = await db.VisitanteSessao.findByPk(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: "Visitante não encontrado." });
    }
    await visitor.destroy();
    res.status(200).json({ message: "Visitante removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover visitante:", error);
    res
      .status(500)
      .json({
        message: "Erro ao remover visitante.",
        errorDetails: error.message,
      });
  }
};

/**
 * Gera o balaústre para uma sessão.
 */
export const gerarBalaustreSessao = async (req, res) => {
  const { id } = req.params;
  try {
    const sessao = await db.MasonicSession.findByPk(id, {
      include: [{ model: db.Balaustre, as: "Balaustre" }],
    });
    if (!sessao)
      return res.status(404).json({ message: "Sessão não encontrada." });

    if (sessao.Balaustre && sessao.Balaustre.googleDocId) {
      await deleteGoogleFile(sessao.Balaustre.googleDocId);
      await sessao.Balaustre.destroy();
    }

    // Coleta de dados para o template...
    const templateData = {
      /* ... (preencha com os dados reais) ... */
    };

    const { googleDocId, pdfPath } = await createBalaustreFromTemplate(
      templateData
    );

    const novoBalaustre = await db.Balaustre.create({
      sessionId: id,
      googleDocId,
      caminhoPdfLocal: pdfPath,
    });

    res
      .status(201)
      .json({
        message: "Balaústre gerado com sucesso!",
        balaustre: novoBalaustre,
      });
  } catch (error) {
    console.error("Erro ao gerar Balaústre:", error);
    res
      .status(500)
      .json({
        message: "Erro ao gerar balaústre.",
        errorDetails: error.message,
      });
  }
};
