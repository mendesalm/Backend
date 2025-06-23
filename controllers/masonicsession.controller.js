import db from "../models/index.js";
import path from "path";
// --- Importa todos os serviços necessários ---
import {
  createBalaustreFromTemplate,
  createEditalFromTemplate,
  deleteGoogleFile, // Importar a função de deletar
} from "../services/googleDocs.service.js";
import * as ChancelerService from "../services/chanceler.service.js";
import { avancarEscalaSequencialEObterResponsavel } from "../services/escala.service.js";
import { enviarEditalDeConvocacaoPorEmail } from "../services/notification.service.js";

/**
 * Lista todas as sessões usando a agregação do Sequelize para contagem,
 * evitando o uso de subconsultas literais que causam lentidão.
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
        {
          model: db.LodgeMember,
          as: "presentes",
          attributes: [],
          through: { attributes: [] },
        },
        { model: db.VisitanteSessao, as: "visitantes", attributes: [] },
      ],
      attributes: {
        include: [
          [
            db.sequelize.fn("COUNT", db.sequelize.col("presentes.id")),
            "presentesCount",
          ],
          [
            db.sequelize.fn("COUNT", db.sequelize.col("visitantes.id")),
            "visitantesCount",
          ],
        ],
      },
      group: ["MasonicSession.id", "Balaustre.id"],
      order: [[sortBy, order.toUpperCase()]],
      subQuery: false,
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

/**
 * Função refatorada que separa a operação crítica (criação da sessão e avanço da escala)
 * das operações secundárias (geração de documentos e envio de e-mail).
 */
export const createSession = async (req, res) => {
  const { dataSessao, tipoSessao, subtipoSessao, ...restOfBody } = req.body;

  // --- PARTE 1: Operação Crítica e Transacional ---
  let novaSessao;
  let responsavelJantar;
  const transaction = await db.sequelize.transaction();
  try {
    responsavelJantar = await avancarEscalaSequencialEObterResponsavel(
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
    console.log(
      `Sessão ${novaSessao.id} e avanço da escala salvos com sucesso no banco.`
    );
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Erro na transação principal (criação da sessão / avanço da escala):",
      error
    );
    return res.status(500).json({
      message: "Falha ao criar o registro da sessão ou avançar a escala.",
      errorDetails: error.message,
    });
  }

  // --- PARTE 2: Operações Secundárias (Pós-Transação) ---
  try {
    const sessionDate = new Date(novaSessao.dataSessao);
    const nomeConjuge =
      responsavelJantar?.familiares?.[0]?.nomeCompleto || "não informada";
    const nomeFinalResponsavel = responsavelJantar
      ? `${responsavelJantar.NomeCompleto} e Cunhada ${nomeConjuge}`
      : "Oferecido pela Loja";

    // Objeto completo com todos os placeholders necessários
    const dadosParaTemplate = {
      NumeroBalaustre: novaSessao.id,
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
      ResponsavelJantar: nomeFinalResponsavel,
      NumeroIrmaosQuadro: 0,
      NumeroVisitantes: 0,
      EmendasBalaustreAnterior: "sem",
      ExpedienteRecebido: "(A preencher)",
      ExpedienteExpedido: "(A preencher)",
      SacoProposta: "(A preencher)",
      OrdemDia: "(A preencher)",
      TempoInstrucao: "(A preencher)",
      TroncoBeneficiencia: "0",
      Palavra: "(A preencher)",
      Emendas: "(A preencher)",

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

    // Gera ambos os documentos
    const [balaustreInfo, editalInfo] = await Promise.all([
      createBalaustreFromTemplate(dadosParaTemplate),
      createEditalFromTemplate(dadosParaTemplate),
    ]);

    // Atualiza a sessão e cria o registro do Balaústre
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

    // Envia o e-mail de convocação
    const caminhoAbsolutoEdital = path.resolve(
      process.cwd(),
      editalInfo.pdfPath.substring(1)
    );
    enviarEditalDeConvocacaoPorEmail(novaSessao, caminhoAbsolutoEdital);

    // Retorna a resposta completa para o frontend
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
        "Sessão criada e escala avançada, mas com falha ao gerar documentos ou enviar e-mail.",
      session: novaSessao, // Retorna a sessão criada mesmo em caso de erro secundário
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
  const transaction = await db.sequelize.transaction(); // Inicia a transação
  try {
    const session = await db.MasonicSession.findByPk(id, { transaction });

    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // --- LÓGICA DE REVERSÃO DA ESCALA ---
    if (
      session.responsavelJantarLodgeMemberId &&
      session.tipoResponsabilidadeJantar === "Sequencial"
    ) {
      console.log("Revertendo avanço sequencial da escala de jantar...");
      // Encontra a entrada na escala que foi marcada como "Cumprido" para esta sessão.
      // A lógica assume que a entrada mais recente "Cumprido" para este membro é a correta.
      const responsavelEntry = await db.ResponsabilidadeJantar.findOne({
        where: {
          lodgeMemberId: session.responsavelJantarLodgeMemberId,
          status: "Cumprido",
        },
        order: [["ordem", "DESC"]],
        transaction,
      });

      if (responsavelEntry) {
        // Encontra a menor ordem atual para colocar o membro de volta no topo
        const minOrdemResult = await db.ResponsabilidadeJantar.findOne({
          attributes: [
            [db.sequelize.fn("min", db.sequelize.col("ordem")), "minOrdem"],
          ],
          where: { status: "Ativo", sessaoDesignadaId: null },
          raw: true,
          transaction,
        });

        // Define a nova ordem como um valor menor que a menor ordem atual
        const novaOrdem = (minOrdemResult.minOrdem || 1) - 1;

        // Atualiza a entrada para reverter o status e a ordem
        await responsavelEntry.update(
          {
            status: "Ativo",
            ordem: novaOrdem,
          },
          { transaction }
        );
        console.log(
          `Membro ID ${responsavelEntry.lodgeMemberId} recolocado no topo da escala.`
        );
      } else {
        console.warn(
          `Não foi encontrada a entrada 'Cumprido' para o membro ${session.responsavelJantarLodgeMemberId} para reverter a escala.`
        );
      }
    }

    // --- FIM DA LÓGICA DE REVERSÃO ---

    // Deleta os arquivos do Google Drive se existirem
    if (session.editalGoogleDocId) {
      await deleteGoogleFile(session.editalGoogleDocId);
    }
    const balaustre = await session.getBalaustre({ transaction });
    if (balaustre && balaustre.googleDocId) {
      await deleteGoogleFile(balaustre.googleDocId);
    }

    // A deleção da sessão vai deletar o balaústre associado via CASCADE
    await session.destroy({ transaction });

    await transaction.commit(); // Confirma todas as operações
    res.status(204).send();
  } catch (error) {
    await transaction.rollback(); // Desfaz tudo em caso de erro
    console.error("Erro em deleteSession:", error);
    res.status(500).json({
      message: "Erro ao deletar sessão.",
      errorDetails: error.message,
    });
  }
};

export const getSessionAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await db.MasonicSession.findByPk(id, {
      include: [
        {
          model: db.LodgeMember,
          as: "presentes",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });
    if (!session) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }
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
    await session.setPresentes(presentMemberIds, { transaction: t });
    await t.commit();
    res
      .status(200)
      .json({ message: "Lista de presença atualizada com sucesso." });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao salvar lista de presentes:", error);
    res.status(500).json({
      message: "Erro ao salvar lista de presentes.",
      errorDetails: error.message,
    });
  }
};

export const getPainelChanceler = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataFim } = req.query;
    if (!dataFim) {
      return res
        .status(400)
        .json({ message: "O parâmetro 'dataFim' é obrigatório." });
    }
    const panelData = await ChancelerService.getPanelData(id, dataFim);
    res.status(200).json(panelData);
  } catch (error) {
    console.error("Erro ao buscar dados do painel do Chanceler:", error);
    if (error.message.includes("não encontrada")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message: "Erro interno ao processar a solicitação.",
      errorDetails: error.message,
    });
  }
};
