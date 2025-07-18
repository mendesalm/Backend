// backend/controllers/masonicsession.controller.js
import db from "../models/index.js";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

// --- Serviços ---
import {
  createBalaustreFromTemplate,
  createEditalFromTemplate,
  createConviteFromTemplate,
  deleteLocalFile,
} from "../services/documents.service.js";
import { avancarEscalaSequencialEObterResponsavel } from "../services/escala.service.js";
import { getNextNumber } from "../services/numbering.service.js";
import { enviarEditalDeConvocacaoPorEmail } from "../services/notification.service.js";

/**
 * Lista todas as sessões.
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
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          required: false,
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Cônjuge" },
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
      ],
      order: [[sortBy, order.toUpperCase()]],
    });

    const sessoesFormatadas = await Promise.all(
      sessions.map(async (sessao) => {
        const sessaoJSON = sessao.toJSON();
        const visitantes = await db.VisitanteSessao.count({
          where: { masonicSessionId: sessao.id },
        });
        sessaoJSON.presentesCount = sessaoJSON.attendees.filter(
          (a) => a.statusPresenca === "Presente"
        ).length;
        sessaoJSON.visitantesCount = visitantes;
        if (sessaoJSON.responsavelJantar?.familiares?.length > 0) {
          sessaoJSON.conjugeResponsavelJantarNome =
            sessaoJSON.responsavelJantar.familiares[0].nomeCompleto;
        }

        // Estruturar Edital e Balaustre como objetos
        sessaoJSON.edital = sessaoJSON.caminhoEditalPdf
          ? { caminhoPdfLocal: sessaoJSON.caminhoEditalPdf }
          : null;
        sessaoJSON.balaustre = sessaoJSON.caminhoBalaustrePdf
          ? { caminhoPdfLocal: sessaoJSON.caminhoBalaustrePdf }
          : null;
        sessaoJSON.convite = sessaoJSON.caminhoConvitePdf
          ? { caminhoPdfLocal: sessaoJSON.caminhoConvitePdf }
          : null;

        // Remover as propriedades diretas para evitar redundância
        delete sessaoJSON.caminhoEditalPdf;
        delete sessaoJSON.caminhoBalaustrePdf;
        delete sessaoJSON.caminhoConvitePdf;

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
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Cônjuge" },
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

    // Estruturar Edital e Balaustre como objetos
    sessionJSON.edital = sessionJSON.caminhoEditalPdf
      ? { caminhoPdfLocal: sessionJSON.caminhoEditalPdf }
      : null;
    sessionJSON.balaustre = sessionJSON.caminhoBalaustrePdf
      ? { caminhoPdfLocal: sessionJSON.caminhoBalaustrePdf }
      : null;
    sessionJSON.convite = sessionJSON.caminhoConvitePdf
      ? { caminhoPdfLocal: sessionJSON.caminhoConvitePdf }
      : null;

    // Remover as propriedades diretas para evitar redundância
    delete sessionJSON.caminhoEditalPdf;
    delete sessionJSON.caminhoBalaustrePdf;
    delete sessionJSON.caminhoConvitePdf;

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
 * Cria uma nova sessão, popula a lista de presença, avança a escala e gera documentos.
 */
export const createSession = async (req, res) => {
  // O validador já converteu a string 'YYYY-MM-DD' para um objeto Date.
  const { dataSessao, tipoSessao, subtipoSessao, ...restOfBody } = req.body;
  const timeZone = "America/Sao_Paulo";

  let novaSessao;
  const transaction = await db.sequelize.transaction();
  try {
    const resultadoEscala = await avancarEscalaSequencialEObterResponsavel(
      transaction
    );
    const responsavelJantar = resultadoEscala
      ? resultadoEscala.membroResponsavel
      : null;
    const responsabilidadeJantarId = resultadoEscala
      ? resultadoEscala.responsabilidadeJantarId
      : null;
    const tipoResponsabilidade = responsavelJantar
      ? "Sequencial"
      : "Institucional";

    const numeroSessao = await getNextNumber("session", transaction);

    novaSessao = await db.MasonicSession.create(
      {
        numero: numeroSessao,
        dataSessao,
        tipoSessao,
        subtipoSessao,
        responsavelJantarLodgeMemberId: responsavelJantar?.id || null,
        responsabilidadeJantarId,
        tipoResponsabilidadeJantar: tipoResponsabilidade,
        ...restOfBody,
      },
      { transaction }
    );

    if (responsabilidadeJantarId) {
      await db.ResponsabilidadeJantar.update(
        { sessaoDesignadaId: novaSessao.id },
        { where: { id: responsabilidadeJantarId }, transaction }
      );
    }

    const membrosAtivos = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      attributes: ["id"],
      transaction,
    });
    if (membrosAtivos.length > 0) {
      const attendeesData = membrosAtivos.map((membro) => ({
        sessionId: novaSessao.id,
        lodgeMemberId: membro.id,
        statusPresenca: "Ausente",
      }));
      await db.SessionAttendee.bulkCreate(attendeesData, { transaction });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Erro na transação de criação da sessão:", error);
    return res
      .status(500)
      .json({
        message:
          "Falha ao criar a sessão, popular presenças ou processar a escala.",
        errorDetails: error.message,
      });
  }

  try {
    const responsavelComFamilia = await db.LodgeMember.findByPk(
      novaSessao.responsavelJantarLodgeMemberId,
      {
        include: [
          {
            model: db.FamilyMember,
            as: "familiares",
            where: { parentesco: "Cônjuge" },
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

    const findOficial = async (nomeCargo) => {
      const cargo = await db.CargoExercido.findOne({
        where: { nomeCargo, dataTermino: null },
        include: [
          { model: db.LodgeMember, as: "membro", attributes: ["NomeCompleto"] },
        ],
        order: [["dataInicio", "DESC"]],
      });
      return cargo?.membro?.NomeCompleto || "(A preencher)";
    };

    const [veneravel, chanceler] = await Promise.all([
      findOficial("Venerável Mestre"),
      findOficial("Chanceler"),
    ]);

    let classeSessaoFormatada = `Sessão ${tipoSessao} no Grau de ${subtipoSessao} Maçom`;
    if (["pública", "comemorativa"].includes(tipoSessao.toLowerCase())) {
      classeSessaoFormatada = `Sessão ${tipoSessao}`;
    }

    const dataSessaoObj = new Date(dataSessao);

    const dadosParaTemplate = {
      ClasseSessao: classeSessaoFormatada,
      ResponsavelJantar: nomeFinalResponsavel,
      hora_sessao: "19h30",
      Veneravel: veneravel,
      Chanceler: chanceler,
      NumeroBalaustre: novaSessao.numero,
      tipo_sessao: tipoSessao,
      grau_sessao: subtipoSessao,
      DiaSessao: formatInTimeZone(
        dataSessaoObj,
        timeZone,
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      ),
      DataAssinatura: formatInTimeZone(
        new Date(),
        timeZone,
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      ),
      data_sessao_extenso: formatInTimeZone(
        dataSessaoObj,
        timeZone,
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      ),
      dia_semana: formatInTimeZone(dataSessaoObj, timeZone, "EEEE", {
        locale: ptBR,
      }),
      formattedDateForFilename: formatInTimeZone(
        dataSessaoObj,
        timeZone,
        "ddMMyy"
      ),
    };

    const [balaustreInfo, editalInfo, conviteInfo] = await Promise.all([
      createBalaustreFromTemplate(dadosParaTemplate, novaSessao.id),
      createEditalFromTemplate(dadosParaTemplate),
      createConviteFromTemplate(dadosParaTemplate),
    ]);

    await db.MasonicSession.update(
      {
        caminhoEditalPdf: editalInfo.pdfPath,
        caminhoBalaustrePdf: balaustreInfo.pdfPath,
        caminhoConvitePdf: conviteInfo.pdfPath,
      },
      { where: { id: novaSessao.id } }
    );

    enviarEditalDeConvocacaoPorEmail(
      novaSessao,
      editalInfo.pdfPath.substring(1)
    );

    const sessaoCompleta = await db.MasonicSession.findByPk(novaSessao.id, {
      include: [
        {
          model: db.SessionAttendee,
          as: "attendees",
          include: [{ model: db.LodgeMember, as: "membro" }],
        },
      ],
    });
    res.status(201).json(sessaoCompleta);
  } catch (error) {
    console.error(
      "Erro nas operações secundárias (geração de docs/email):",
      error
    );
    res
      .status(201)
      .json({
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

    // Re-fetch the session with all required associations
    const updatedSession = await db.MasonicSession.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Cônjuge" },
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

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Erro em updateSession:", error);
    res.status(500).json({
      message: "Erro ao atualizar sessão.",
      errorDetails: error.message,
    });
  }
};

/**
 * Deleta uma sessão maçônica e reverte a escala de jantar de forma precisa.
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

    // --- LÓGICA DE REVERSÃO PRECISA DA ESCALA ---
    // Se a sessão tinha um responsável da escala vinculado diretamente...
    if (session.responsabilidadeJantarId) {
      const responsavelEntry = await db.ResponsabilidadeJantar.findByPk(
        session.responsabilidadeJantarId,
        { transaction }
      );

      if (responsavelEntry) {
        // Encontra a menor ordem para mover o membro de volta ao início da fila.
        const minOrdemResult = await db.ResponsabilidadeJantar.findOne({
          attributes: [
            [db.sequelize.fn("min", db.sequelize.col("ordem")), "minOrdem"],
          ],
          where: { status: "Ativo", sessaoDesignadaId: null },
          raw: true,
          transaction,
        });
        const novaOrdem = (minOrdemResult.minOrdem || 1) - 1;

        // Reverte o membro para o início da fila e desvincula da sessão deletada.
        await responsavelEntry.update(
          {
            ordem: novaOrdem,
            sessaoDesignadaId: null, // Desvincula o ID da sessão
          },
          { transaction }
        );
        console.log(
          `Escala revertida para o registro de responsabilidade ID: ${responsavelEntry.id}. Nova ordem: ${novaOrdem}`
        );
      }
    }

    // Deleta arquivos associados localmente
    if (session.caminhoEditalPdf) {
      await deleteLocalFile(session.caminhoEditalPdf).catch((err) =>
        console.error("Falha ao deletar edital local:", err)
      );
    }
    if (session.caminhoBalaustrePdf) {
      await deleteLocalFile(session.caminhoBalaustrePdf).catch((err) =>
        console.error("Falha ao deletar balaústre local:", err)
      );
    }
    if (session.caminhoConvitePdf) {
      await deleteLocalFile(session.caminhoConvitePdf).catch((err) =>
        console.error("Falha ao deletar convite local:", err)
      );
    }

    // Finalmente, destrói o registro da sessão
    await session.destroy({ transaction });

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error("Erro em deleteSession:", error);
    res.status(500).json({
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
    return res.status(400).json({
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

    // Re-fetch the session with all required associations to return updated data
    const updatedSession = await db.MasonicSession.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          attributes: ["id", "NomeCompleto"],
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              attributes: ["nomeCompleto", "parentesco"],
              where: { parentesco: "Cônjuge" },
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

    res.status(200).json(updatedSession);
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar presenças:", error);
    res.status(500).json({
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
      where: { masonicSessionId: sessionId, nomeCompleto: nome },
      defaults: {
        masonicSessionId: sessionId,
        nomeCompleto: nome,
        loja,
        oriente,
      },
    });
    res.status(201).json(visitor);
  } catch (error) {
    console.error("Erro ao adicionar visitante:", error);
    res.status(500).json({
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
    res.status(500).json({
      message: "Erro ao remover visitante.",
      errorDetails: error.message,
    });
  }
};

/**
 * Gera o balaústre para uma sessão, preenchendo todos os dados necessários.
 */
export const gerarBalaustreSessao = async (req, res) => {
  const { id } = req.params;
  try {
    const sessao = await db.MasonicSession.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "responsavelJantar",
          include: [
            {
              model: db.FamilyMember,
              as: "familiares",
              where: { parentesco: "Cônjuge" },
              required: false,
            },
          ],
        },
      ],
    });

    if (!sessao) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // Deleta o balaústre antigo, se existir
    if (sessao.caminhoBalaustrePdf) {
      await deleteLocalFile(sessao.caminhoBalaustrePdf);
    }

    const { tipoSessao, subtipoSessao, dataSessao } = sessao;
    const sessionDate = new Date(dataSessao);

    // --- Coleta de Dados Detalhada ---

    // 1. Nomes dos oficiais (busca o cargo ativo que não tem data de término)
    const findOficial = async (nomeCargo) => {
      const cargo = await db.CargoExercido.findOne({
        where: { nomeCargo, dataTermino: null },
        include: [
          { model: db.LodgeMember, as: "membro", attributes: ["NomeCompleto"] },
        ],
        order: [["dataInicio", "DESC"]], // Garante pegar o mais recente se houver dados inconsistentes
      });
      return cargo?.membro?.NomeCompleto || "(A preencher)";
    };

    const [
      veneravel,
      primeiroVigilante,
      segundoVigilante,
      orador,
      secretario,
      tesoureiro,
      chanceler,
    ] = await Promise.all([
      findOficial("Venerável Mestre"),
      findOficial("Primeiro Vigilante"),
      findOficial("Segundo Vigilante"),
      findOficial("Orador"),
      findOficial("Secretário"),
      findOficial("Tesoureiro"),
      findOficial("Chanceler"),
    ]);

    // 2. Contagens
    const numeroIrmaosQuadro = await db.SessionAttendee.count({
      where: { sessionId: id, statusPresenca: "Presente" },
    });
    const numeroVisitantes = await db.VisitanteSessao.count({
      where: { masonicSessionId: id },
    });

    // 3. Responsável pelo Jantar
    const nomeConjuge =
      sessao.responsavelJantar?.familiares?.[0]?.nomeCompleto ||
      "não informada";
    const nomeFinalResponsavel = sessao.responsavelJantar
      ? `${sessao.responsavelJantar.NomeCompleto} e Cunhada ${nomeConjuge}`
      : "Oferecido pela Loja";

    // 4. Formatação da Classe da Sessão
    let classeSessaoFormatada;
    const tipoSessaoLowerCase = tipoSessao.toLowerCase();
    if (["pública", "comemorativa"].includes(tipoSessaoLowerCase)) {
      classeSessaoFormatada = `Sessão ${tipoSessao}`;
    } else {
      classeSessaoFormatada = `Sessão ${tipoSessao} no Grau de ${subtipoSessao} Maçom`;
    }

    // 5. Construção do Objeto de Dados para o Template
    const dadosParaTemplate = {
      NumeroBalaustre: sessao.numero,
      ClasseSessao: classeSessaoFormatada,
      DiaSessao: sessionDate.toLocaleDateString("pt-BR", {
        dateStyle: "long",
        timeZone: "UTC",
      }),
      DataSessaoAnterior: "(A preencher)",
      HoraInicioSessao: "19h30",
      HoraEncerramento: "(A preencher)",
      DataAssinatura: `Anápolis-Goiás, ${sessionDate.toLocaleDateString(
        "pt-BR",
        { dateStyle: "long", timeZone: "UTC" }
      )}`,
      Veneravel: veneravel,
      PrimeiroVigilante: primeiroVigilante,
      SegundoVigilante: segundoVigilante,
      Orador: orador,
      Secretario: secretario,
      Tesoureiro: tesoureiro,
      Chanceler: chanceler,
      ResponsavelJantar: nomeFinalResponsavel,
      NumeroIrmaosQuadro: numeroIrmaosQuadro,
      NumeroVisitantes: numeroVisitantes,
      EmendasBalaustreAnterior: "Sem",
      ExpedienteRecebido: "(A preencher)",
      ExpedienteExpedido: "(A preencher)",
      SacoProposta: "(A preencher)",
      OrdemDia: "(A preencher)",
      TempoInstrucao: "(A preencher)",
      TroncoBeneficiencia: "0",
      Palavra: "(A preencher)",
      Emendas: "(A preencher)",
    };

    // --- Geração e Salvamento do Novo Balaústre ---
    const { pdfPath } = await createBalaustreFromTemplate(
      dadosParaTemplate,
      sessao.id
    );

    // Update the session with the new balaustre path
    await db.MasonicSession.update(
      { caminhoBalaustrePdf: pdfPath },
      { where: { id: sessao.id } }
    );

    res.status(201).json({
      message: "Balaústre gerado/atualizado com sucesso!",
      caminhoBalaustrePdf: pdfPath,
    });
  } catch (error) {
    console.error("Erro ao gerar Balaústre:", error);
    res.status(500).json({
      message: "Erro ao gerar o balaústre.",
      errorDetails: error.message,
    });
  }
};