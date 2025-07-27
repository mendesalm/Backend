// backend/controllers/masonicsession.controller.js
import db from "../models/index.js";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

// --- Serviços ---
import {
  createBalaustreFromTemplate,
  createEditalFromTemplate,
  createConviteFromTemplate,
  deleteLocalFile,
  regenerateBalaustrePdf,
} from "../services/documents.service.js";
import { avancarEscalaSequencialEObterResponsavel } from "../services/escala.service.js";
import { getNextNumber, revertNumber } from "../services/numbering.service.js";
import { enviarEditalDeConvocacaoPorEmail } from "../services/notification.service.js";
import { Op } from "sequelize";
/**
 * Lista todas as sessões.
 */
export const getAllSessions = async (req, res) => {
  try {
    const {
      sortBy = "dataSessao",
      order = "DESC",
      tipoSessao,
      limit,
      startDate,
    } = req.query;

    // Definição do 'include' para reutilização
    const includeClause = [
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
      {
        model: db.Balaustre,
        as: "balaustre",
        attributes: ["id", "caminhoPdfLocal", "status"],
        required: false,
      },
    ];

    let sessions;

    if (startDate) {
      // --- NOVA LÓGICA PARA BUSCAR SESSÕES FUTURAS E PASSADAS ---
      const referenceDate = new Date(startDate);
      const whereConditions = tipoSessao ? { tipoSessao } : {};

      const futureSessions = await db.MasonicSession.findAll({
        where: { ...whereConditions, dataSessao: { [Op.gte]: referenceDate } },
        include: includeClause,
        order: [["dataSessao", "ASC"]],
        limit: 5,
      });

      const pastSessions = await db.MasonicSession.findAll({
        where: { ...whereConditions, dataSessao: { [Op.lt]: referenceDate } },
        include: includeClause,
        order: [["dataSessao", "DESC"]],
        limit: 5,
      });

      // Combina os resultados, com os passados primeiro (em ordem cronológica)
      sessions = [...pastSessions.reverse(), ...futureSessions];
    } else {
      // --- LÓGICA ORIGINAL COM ADIÇÃO DO 'LIMIT' ---
      const whereClause = tipoSessao ? { tipoSessao } : {};
      const queryOptions = {
        where: whereClause,
        include: includeClause,
        order: [[sortBy, order.toUpperCase()]],
      };

      if (limit) {
        queryOptions.limit = parseInt(limit);
      }

      sessions = await db.MasonicSession.findAll(queryOptions);
    }

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

        // Oculta o link do balaústre se não estiver Aprovado
        if (
          sessaoJSON.balaustre &&
          sessaoJSON.balaustre.status === "Aprovado"
        ) {
          sessaoJSON.balaustre.caminhoPdfLocal =
            sessaoJSON.balaustre.caminhoPdfLocal;
        } else if (sessaoJSON.balaustre) {
          sessaoJSON.balaustre.caminhoPdfLocal = null;
        }

        // Mantém a estrutura para edital e convite
        sessaoJSON.edital = sessaoJSON.caminhoEditalPdf
          ? { caminhoPdfLocal: sessaoJSON.caminhoEditalPdf }
          : null;

        sessaoJSON.convite = sessaoJSON.caminhoConvitePdf
          ? { caminhoPdfLocal: sessaoJSON.caminhoConvitePdf }
          : null;

        return sessaoJSON;
      })
    );

    res.status(200).json(sessoesFormatadas);
  } catch (error) {
    console.error("Erro em getAllSessions:", error);
    res.status(500).json({
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
        {
          model: db.Balaustre,
          as: "balaustre",
          attributes: ["id", "caminhoPdfLocal"],
          required: false,
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

    sessionJSON.convite = sessionJSON.caminhoConvitePdf
      ? { caminhoPdfLocal: sessionJSON.caminhoConvitePdf }
      : null;

    // Remover as propriedades diretas para evitar redundância
    delete sessionJSON.caminhoEditalPdf;

    delete sessionJSON.caminhoConvitePdf;

    res.status(200).json(sessionJSON);
  } catch (error) {
    console.error("Erro em getSessionById:", error);
    res.status(500).json({
      message: "Erro ao buscar detalhes da sessão.",
      errorDetails: error.message,
    });
  }
};

/**
 * Cria uma nova sessão, popula a lista de presença, avança a escala (se aplicável) e gera documentos.
 */
export const createSession = async (req, res) => {
  // O validador já converteu a string para um objeto Date UTC.
  let {
    dataSessao,
    tipoSessao,
    subtipoSessao,
    tipoResponsabilidadeJantar = "Sequencial",
    objetivoSessao,
    ...restOfBody
  } = req.body;

  // Validação e definição de objetivoSessao
  if (
    tipoSessao === "Especial" &&
    (subtipoSessao === "Administrativa" || subtipoSessao === "Eleitoral")
  ) {
    if (!objetivoSessao) {
      return res.status(400).json({
        message:
          "Para sessões Especiais Administrativas ou Eleitorais, o objetivo da sessão é obrigatório.",
      });
    }
  } else {
    objetivoSessao = objetivoSessao || "Sessão Regular";
  }

  // Ensure dataSessao is a Date object
  if (!(dataSessao instanceof Date)) {
    dataSessao = new Date(dataSessao);
  }

  let novaSessao;
  const transaction = await db.sequelize.transaction();
  try {
    let responsavelJantar = null;
    let responsabilidadeJantarId = null;

    // A lógica da escala só é executada se a responsabilidade for 'Sequencial'
    if (tipoResponsabilidadeJantar === "Sequencial") {
      const resultadoEscala = await avancarEscalaSequencialEObterResponsavel(
        transaction
      );
      if (resultadoEscala) {
        responsavelJantar = resultadoEscala.membroResponsavel;
        responsabilidadeJantarId = resultadoEscala.responsabilidadeJantarId;
      }
    }
    // Para 'Institucional' ou 'Especial', os responsáveis são nulos por padrão

    const numeroSessao = await getNextNumber("session", transaction);

    novaSessao = await db.MasonicSession.create(
      {
        numero: numeroSessao,
        dataSessao,
        tipoSessao,
        subtipoSessao,
        responsavelJantarLodgeMemberId: responsavelJantar?.id || null,
        responsabilidadeJantarId, // Pode ser null
        tipoResponsabilidadeJantar, // Salva o tipo de responsabilidade
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
    return res.status(500).json({
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

    const numeroIrmaosQuadro = await db.SessionAttendee.count({
      where: { sessionId: novaSessao.id, statusPresenca: "Presente" },
    });
    const numeroVisitantes = await db.VisitanteSessao.count({
      where: { masonicSessionId: novaSessao.id },
    });

    let classeSessaoFormatada = `Sessão ${tipoSessao} no Grau de ${subtipoSessao} Maçom`;
    if (["pública", "comemorativa"].includes(tipoSessao.toLowerCase())) {
      classeSessaoFormatada = `Sessão ${tipoSessao}`;
    }

    const dadosParaTemplate = {
      numero_balaustre: novaSessao.numero,
      classe_sessao: classeSessaoFormatada,
      dia_sessao: format(dataSessao, "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      }),
      data_assinatura: format(new Date(), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      }),
      data_sessao_extenso: format(dataSessao, "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      }),
      dia_semana: format(dataSessao, "EEEE", {
        locale: ptBR,
      }),
      formattedDateForFilename: format(dataSessao, "ddMMyy"),
      responsavel_jantar: nomeFinalResponsavel,
      hora_sessao: "19h30",
      veneravel: veneravel,
      primeiro_vigilante: primeiroVigilante,
      segundo_vigilante: segundoVigilante,
      orador: orador,
      secretario: secretario,
      tesoureiro: tesoureiro,
      chanceler: chanceler,
      numero_irmaos_quadro: numeroIrmaosQuadro,
      numero_visitantes: numeroVisitantes,
      data_sessao_anterior: "",
      emendas_balaustre_anterior: "",
      expediente_recebido: "",
      expediente_expedido: "",
      saco_proposta: "",
      ordem_dia: "",
      escrutinio: "",
      tempo_instrucao: "",
      tronco_beneficencia: "",
      palavra: "",
      emendas: "",
      // Convite specific placeholders
      tipo_sessao: tipoSessao,
      grau_sessao: subtipoSessao,
      OBJETIVO: objetivoSessao || "",
    };

    console.log("[createSession] dadosParaTemplate:", dadosParaTemplate);

    const balaustreInstance = await createBalaustreFromTemplate(
      dadosParaTemplate,
      novaSessao.id,
      novaSessao.numero
    );
    console.log(
      "[createSession] balaustreInstance (after creation):",
      balaustreInstance
    );

    const edital = await createEditalFromTemplate(
      dadosParaTemplate,
      req.user.NomeCompleto,
      novaSessao.numero
    );
    console.log("[createSession] edital (after creation):", edital);

    const conviteInfo = await createConviteFromTemplate(dadosParaTemplate);
    console.log("[createSession] conviteInfo (after creation):", conviteInfo);

    // Regenerate the PDF to include initial signature lines
    const balaustrePdfPath = balaustreInstance.caminhoPdfLocal; // Use the path already generated by createBalaustreFromTemplate
    console.log(
      "[createSession] balaustrePdfPath (from instance):",
      balaustrePdfPath
    );

    const updateResult = await db.MasonicSession.update(
      {
        caminhoEditalPdf: edital.pdfPath,
        caminhoBalaustrePdf: balaustrePdfPath,
        caminhoConvitePdf: conviteInfo.pdfPath,
        balaustreId: balaustreInstance.id, // Save the balaustreId
      },
      { where: { id: novaSessao.id } }
    );
    console.log("[createSession] MasonicSession.update result:", updateResult);

    enviarEditalDeConvocacaoPorEmail(novaSessao, edital.pdfPath.substring(1));
    console.log("[createSession] Email sent.");

    const sessaoCompleta = await db.MasonicSession.findByPk(novaSessao.id, {
      include: [
        {
          model: db.SessionAttendee,
          as: "attendees",
          include: [{ model: db.LodgeMember, as: "membro" }],
        },
      ],
      attributes: {
        include: ["caminhoEditalPdf", "caminhoConvitePdf", "caminhoBalaustrePdf"],
      },
    });
    console.log(
      "[createSession] sessaoCompleta (before response):",
      sessaoCompleta
    );

    const sessaoCompletaJSON = sessaoCompleta.toJSON();

    sessaoCompletaJSON.edital = sessaoCompletaJSON.caminhoEditalPdf
      ? { caminhoPdfLocal: sessaoCompletaJSON.caminhoEditalPdf }
      : null;

    sessaoCompletaJSON.convite = sessaoCompletaJSON.caminhoConvitePdf
      ? { caminhoPdfLocal: sessaoCompletaJSON.caminhoConvitePdf }
      : null;

    res.status(201).json(sessaoCompletaJSON);
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
  // O validador já tratou a conversão de dataSessao, se presente.
  const {
    dataSessao,
    tipoSessao,
    subtipoSessao,
    objetivoSessao,
    ...outrosCampos
  } = req.body;

  // Validação e definição de objetivoSessao para atualização
  let finalObjetivoSessao = objetivoSessao;
  if (
    tipoSessao === "Especial" &&
    (subtipoSessao === "Administrativa" || subtipoSessao === "Eleitoral")
  ) {
    if (!finalObjetivoSessao) {
      return res.status(400).json({
        message:
          "Para sessões Especiais Administrativas ou Eleitorais, o objetivo da sessão é obrigatório.",
      });
    }
  } else if (finalObjetivoSessao === undefined) {
    // Se objetivoSessao não foi enviado no body, mantém o valor existente ou define como 'Sessão Regular' se for nulo
    finalObjetivoSessao = session.objetivoSessao || "Sessão Regular";
  } else if (finalObjetivoSessao === null) {
    // Se foi enviado explicitamente como null, mantém null
    finalObjetivoSessao = null;
  } else {
    // Se foi enviado com um valor, usa esse valor
    finalObjetivoSessao = finalObjetivoSessao || "Sessão Regular";
  }

  try {
    const session = await db.MasonicSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    const updateData = { ...outrosCampos, objetivoSessao: finalObjetivoSessao };
    if (dataSessao) {
      updateData.dataSessao = dataSessao; // dataSessao já é um objeto Date UTC
    }

    await session.update(updateData);

    // Regenerate Edital PDF if it exists
    // if (session.caminhoEditalPdf) {
    //   const { pdfPath: editalPdfPath } = await regenerateEditalPdf(id);
    //   await session.update({ caminhoEditalPdf: editalPdfPath });
    // }

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
    // Se a sessão tinha um responsável da escala vinculado e era do tipo Sequencial...
    console.log(
      `[deleteSession] session.tipoResponsabilidadeJantar: ${session.tipoResponsabilidadeJantar}`
    );
    console.log(
      `[deleteSession] session.responsabilidadeJantarId: ${session.responsabilidadeJantarId}`
    );
    if (
      session.tipoResponsabilidadeJantar === "Sequencial" &&
      session.responsabilidadeJantarId
    ) {
      const responsavelEntry = await db.ResponsabilidadeJantar.findByPk(
        session.responsabilidadeJantarId,
        { transaction }
      );
      if (responsavelEntry) {
        // Apenas volta o status para "não foi responsável", o membro
        // estará automaticamente disponível na sua posição alfabética correta.
        await responsavelEntry.update(
          { sessaoDesignadaId: null, foiResponsavelNoCiclo: false },
          { transaction }
        );
      }
    }

    // Reverter o número da sessão
    if (session.numero) {
      await revertNumber("session", session.numero, transaction);
      console.log(`Número da sessão ${session.numero} revertido.`);
    }

    // Deleta arquivos associados localmente
    const filesToDelete = [
      session.caminhoEditalPdf,
      session.caminhoBalaustrePdf,
      session.caminhoConvitePdf,
    ].filter(Boolean); // Filter out null or undefined paths

    for (const filePath of filesToDelete) {
      try {
        await deleteLocalFile(filePath);
      } catch (err) {
        console.error(
          `Falha crítica ao deletar arquivo local ${filePath}:`,
          err
        );
        // Re-throw to ensure transaction rollback if file deletion fails
        throw new Error(`Falha ao deletar arquivo associado: ${filePath}`);
      }
    }

    // Finalmente, destrói o registro da sessão
    await session.destroy({ transaction });

    await transaction.commit();
    let responseMessage = "Sessão deletada com sucesso.";
    let escalaAtualizada = null;

    if (
      session.tipoResponsabilidadeJantar === "Sequencial" &&
      session.responsabilidadeJantarId
    ) {
      escalaAtualizada = await db.ResponsabilidadeJantar.findAll({
        where: { status: "Ativo" },
        order: [["ordem", "ASC"]],
      });
      responseMessage =
        "Sessão deletada e escala de jantar revertida com sucesso.";
    }

    res.status(200).json({ message: responseMessage, escalaAtualizada });
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

    const { tipoSessao, subtipoSessao, dataSessao, objetivoSessao } = sessao;

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
      numero_balaustre: novaSessao.numero,
      classe_sessao: classeSessaoFormatada,
      dia_sessao: dataSessao.toLocaleDateString("pt-BR", {
        dateStyle: "long",
        timeZone: "UTC",
      }),
      DataSessaoAnterior: "(A preencher)",
      HoraInicioSessao: "19h30",
      HoraEncerramento: "(A preencher)",
      DataAssinatura: `Anápolis-Goiás, ${dataSessao.toLocaleDateString(
        "pt-BR",
        { dateStyle: "long", timeZone: "UTC" }
      )}`,
      veneravel: veneravel,
      primeiro_vigilante: primeiroVigilante,
      segundo_vigilante: segundoVigilante,
      orador: orador,
      secretario: secretario,
      tesoureiro: tesoureiro,
      Chanceler: chanceler,
      ResponsavelJantar: nomeFinalResponsavel,
      numero_irmaos_quadro: numeroIrmaosQuadro,
      numero_visitantes: numeroVisitantes,
      emendas_balaustre_anterior: "Sem",
      expediente_recebido: "(A preencher)",
      expediente_expedido: "(A preencher)",
      saco_proposta: "(A preencher)",
      ordem_dia: "(A preencher)",
      tempo_instrucao: "(A preencher)",
      tronco_beneficencia: "0",
      palavra: "(A preencher)",
      emendas: "(A preencher)",
      objetivo: objetivoSessao || "",
    };

    // --- Geração e Salvamento do Novo Balaústre ---
    const balaustre = await createBalaustreFromTemplate(
      dadosParaTemplate,
      sessao.id
    );

    // Regenerate the PDF to include initial signature lines
    const { pdfPath } = await regenerateBalaustrePdf(balaustre.id);

    // Update the session with the new balaustre path
    await db.MasonicSession.update(
      {
        caminhoBalaustrePdf: pdfPath,
        balaustreId: balaustre.id,
      },
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
