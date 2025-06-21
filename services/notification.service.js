// services/notification.service.js
import db from "../models/index.js";
import { Op, fn, col } from "sequelize";
import sendEmail from "../utils/emailSender.js";

/**
 * Substitui placeholders em um template string.
 * @param {string} template - O template com placeholders como {{chave}}.
 * @param {object} data - O objeto com os dados para substituição.
 * @returns {string} - O template com os valores preenchidos.
 */
function hydrateTemplate(template, data) {
  if (!template) return "";
  return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
    const keys = key.split(".");
    let value = data;
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    return value !== undefined ? value : match;
  });
}

/**
 * Dispara uma notificação por e-mail baseada em um gatilho.
 * @param {string} eventoGatilho - O nome do gatilho (ex: 'ANIVERSARIO_MEMBRO').
 * @param {object} destinatario - O objeto do membro que receberá a mensagem.
 * @param {object} contextData - Dados adicionais para o template (ex: { sessao: ... }).
 */
async function dispatchEmail(eventoGatilho, destinatario, contextData = {}) {
  try {
    const template = await db.MensagemTemplate.findOne({
      where: { eventoGatilho, ativo: true },
    });
    if (!template) {
      console.warn(
        `[Notification] Template para gatilho '${eventoGatilho}' não encontrado ou inativo.`
      );
      return;
    }

    if (!destinatario.Email) {
      console.warn(
        `[Notification] Destinatário ${destinatario.NomeCompleto} não possui e-mail.`
      );
      return;
    }

    const data = { ...destinatario.toJSON(), ...contextData };
    const assunto = hydrateTemplate(template.assunto, data);
    const corpo = hydrateTemplate(template.corpo, data);

    await sendEmail({
      to: destinatario.Email,
      subject: assunto,
      html: corpo,
      text: corpo.replace(/<[^>]*>?/gm, ""),
    });

    console.log(
      `[Notification] E-mail do gatilho '${eventoGatilho}' enviado para ${destinatario.Email}.`
    );
  } catch (error) {
    console.error(
      `[Notification] Falha ao enviar e-mail para o gatilho ${eventoGatilho}:`,
      error
    );
  }
}

// --- Funções de Lógica de Negócio ---

export async function notificarAniversariantesDoDia() {
  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;

  try {
    // CORREÇÃO: A estrutura do where foi consertada para o padrão Sequelize.
    const whereMembros = {
      Situacao: "Ativo",
      [Op.and]: [
        db.sequelize.where(fn("DAY", col("DataNascimento")), dia),
        db.sequelize.where(fn("MONTH", col("DataNascimento")), mes),
      ],
    };
    const membros = await db.LodgeMember.findAll({ where: whereMembros });
    for (const membro of membros)
      await dispatchEmail("ANIVERSARIO_MEMBRO", membro);

    const whereFamiliares = {
      [Op.and]: [
        db.sequelize.where(fn("DAY", col("dataNascimento")), dia),
        db.sequelize.where(fn("MONTH", col("dataNascimento")), mes),
      ],
    };
    const familiares = await db.FamilyMember.findAll({
      where: whereFamiliares,
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          where: { Situacao: "Ativo" },
          required: true,
        },
      ],
    });
    for (const familiar of familiares)
      await dispatchEmail("ANIVERSARIO_FAMILIAR", familiar.membro, {
        familiar,
      });
  } catch (error) {
    console.error("[Notify] Erro ao buscar aniversariantes:", error);
  }
}

export async function notificarAniversariosMaconicos() {
  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  try {
    // CORREÇÃO: A estrutura do where foi consertada.
    const whereClause = (dateField) => ({
      [Op.and]: [
        db.sequelize.where(fn("DAY", col(dateField)), dia),
        db.sequelize.where(fn("MONTH", col(dateField)), mes),
        db.sequelize.where(fn("YEAR", col(dateField)), { [Op.ne]: anoAtual }),
      ],
    });

    const membrosComIniciacao = await db.LodgeMember.findAll({
      where: whereClause("DataIniciacao"),
    });
    for (const m of membrosComIniciacao) {
      const anos = anoAtual - new Date(m.DataIniciacao).getFullYear();
      if (anos > 0)
        await dispatchEmail("ANIVERSARIO_MACONICO", m, {
          tipoAniversario: "Iniciação",
          anos: anos,
        });
    }

    const membrosComElevacao = await db.LodgeMember.findAll({
      where: whereClause("DataElevacao"),
    });
    for (const m of membrosComElevacao) {
      const anos = anoAtual - new Date(m.DataElevacao).getFullYear();
      if (anos > 0)
        await dispatchEmail("ANIVERSARIO_MACONICO", m, {
          tipoAniversario: "Elevação",
          anos: anos,
        });
    }

    const membrosComExaltacao = await db.LodgeMember.findAll({
      where: whereClause("DataExaltacao"),
    });
    for (const m of membrosComExaltacao) {
      const anos = anoAtual - new Date(m.DataExaltacao).getFullYear();
      if (anos > 0)
        await dispatchEmail("ANIVERSARIO_MACONICO", m, {
          tipoAniversario: "Exaltação",
          anos: anos,
        });
    }
  } catch (error) {
    console.error("[Notify] Erro ao buscar aniversários maçônicos:", error);
  }
}

export async function notificarCadastroAprovado(membroId) {
  const membro = await db.LodgeMember.findByPk(membroId);
  if (membro) {
    await dispatchEmail("CADASTRO_APROVADO", membro);
  }
}

export async function verificarAusenciasConsecutivas() {
  try {
    const ultimasSessoes = await db.MasonicSession.findAll({
      order: [["dataSessao", "DESC"]],
      limit: 3,
      attributes: ["id"],
    });
    if (ultimasSessoes.length < 3) return;

    const idsSessoes = ultimasSessoes.map((s) => s.id);
    const membrosAtivos = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo" },
      attributes: ["id", "NomeCompleto", "Email"],
    });

    for (const membro of membrosAtivos) {
      const presencas = await db.SessionAttendee.count({
        where: { lodgeMemberId: membro.id, sessionId: { [Op.in]: idsSessoes } },
      });
      if (presencas === 0) {
        await dispatchEmail("AVISO_AUSENCIA_CONSECUTIVA", membro);
      }
    }
  } catch (error) {
    console.error("[Notify] Erro ao verificar ausências:", error);
  }
}

export async function enviarConvocacaoSessaoColetiva() {
  try {
    const hoje = new Date();
    const proximaSexta = new Date(hoje);
    // Lógica para encontrar a próxima sexta-feira a partir de hoje
    proximaSexta.setDate(hoje.getDate() + ((5 + 7 - hoje.getDay()) % 7));
    proximaSexta.setHours(0, 0, 0, 0);

    const fimDaSexta = new Date(proximaSexta);
    fimDaSexta.setHours(23, 59, 59, 999);

    const sessaoDaSemana = await db.MasonicSession.findOne({
      where: { dataSessao: { [Op.between]: [proximaSexta, fimDaSexta] } },
    });

    if (sessaoDaSemana) {
      const dataFormatada = new Date(
        sessaoDaSemana.dataSessao
      ).toLocaleDateString("pt-BR", { dateStyle: "full" });
      const membrosAtivos = await db.LodgeMember.findAll({
        where: { Situacao: "Ativo" },
      });

      for (const membro of membrosAtivos) {
        const sessaoContext = {
          data: dataFormatada,
          tipoSessao: sessaoDaSemana.tipoSessao,
          subtipoSessao: sessaoDaSemana.subtipoSessao,
        };
        // CORREÇÃO: A estrutura do objeto de contexto está correta.
        await dispatchEmail("CONVOCACAO_SESSAO_COLETIVA", membro, {
          sessao: sessaoContext,
        });
      }
      console.log(
        `[Notify] Convocação coletiva enviada para ${membrosAtivos.length} membros.`
      );
    } else {
      console.log(
        "[Notify] Nenhuma sessão encontrada para a próxima sexta-feira. Nenhuma convocação enviada."
      );
    }
  } catch (error) {
    console.error("[Notify] Erro ao enviar convocação coletiva:", error);
  }
}
/**
 * --- NOVA FUNÇÃO ---
 * Envia o email de convocação com o Edital em PDF como anexo.
 * @param {object} session - O objeto da sessão recém-criada.
 * @param {string} caminhoEditalPdf - O caminho relativo para o PDF do edital.
 */
export const enviarEditalDeConvocacaoPorEmail = async (
  session,
  caminhoEditalPdf
) => {
  try {
    const membros = await db.LodgeMember.findAll({
      where: { Situacao: "Ativo", Email: { [db.Sequelize.Op.ne]: null } },
      attributes: ["Email"],
    });

    if (membros.length === 0) {
      console.log(
        "Nenhum membro ativo com email para notificar sobre o edital."
      );
      return;
    }

    const to = membros.map((m) => m.Email).join(", ");
    const dataFormatada = new Date(session.dataSessao).toLocaleDateString(
      "pt-BR",
      { dateStyle: "full", timeZone: "UTC" }
    );
    const subject = `Convocação para Sessão de ${session.tipoSessao} - ${dataFormatada}`;
    const html = `
      <p>Prezados Irmãos,</p>
      <p>Segue em anexo o Edital de Convocação para a nossa próxima Sessão Maçônica.</p>
      <p>Contamos com a presença de todos.</p>
      <p>TFA.</p>
    `;

    // Constrói o caminho absoluto para o anexo
    const caminhoAbsolutoAnexo = path.resolve(
      process.cwd(),
      "uploads",
      caminhoEditalPdf
    );

    await sendEmail({
      to: to,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: `Edital_Convocacao_${session.dataSessao}.pdf`,
          path: caminhoAbsolutoAnexo,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(
      `Email de convocação com edital enviado para ${membros.length} membros.`
    );
  } catch (error) {
    console.error("Erro ao enviar email de convocação com edital:", error);
  }
};
