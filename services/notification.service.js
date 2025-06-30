// services/notification.service.js
import path from "path";
import db from "../models/index.js";
import { Op, fn, col } from "sequelize";
import { sendEmail } from "../utils/emailSender.js";
import { gerarCartaoAniversarioPDF } from "./chanceler.service.js"; // Importamos o gerador de cartões
import fs from "fs"; // Módulo File System para deletar o cartão após o envio

/**
 * Função auxiliar para substituir placeholders em um template.
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
 * Função auxiliar para buscar todos os aniversariantes (membros e familiares) do dia.
 * @returns {Promise<Array<object>>}
 */
const getAniversariantesDoDia = async () => {
  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;

  const whereClause = {
    [Op.and]: [
      db.sequelize.where(fn("DAY", col("DataNascimento")), dia),
      db.sequelize.where(fn("MONTH", col("DataNascimento")), mes),
    ],
  };

  const membros = await db.LodgeMember.findAll({
    where: { ...whereClause, Situacao: "Ativo" },
  });

  const familiares = await db.FamilyMember.findAll({
    where: { ...whereClause, falecido: false },
    include: [
      {
        model: db.LodgeMember,
        as: "membro",
        where: { Situacao: "Ativo" },
        required: true,
      },
    ],
  });

  // Unifica e formata a lista
  const listaMembros = membros.map((m) => ({
    nome: m.NomeCompleto,
    dataNascimento: m.DataNascimento,
    emailParaNotificar: m.Email,
    tipo: "Membro",
    objetoOriginal: m.toJSON(), // Passa o objeto completo para o template
  }));

  const listaFamiliares = familiares.map((f) => ({
    nome: f.nomeCompleto,
    dataNascimento: f.dataNascimento,
    emailParaNotificar: f.membro.Email,
    tipo: "Familiar",
    objetoOriginal: { ...f.toJSON(), membro: f.membro.toJSON() }, // Passa o familiar e o membro
  }));

  return [...listaMembros, ...listaFamiliares];
};

// --- Funções de Lógica de Negócio Exportadas ---

/**
 * REATORADO: Orquestra a geração de cartões e o envio de e-mails de aniversário.
 * Esta função será chamada pelo scheduler.
 */
export async function notificarAniversariantesDoDiaComCartao() {
  console.log(
    "[Notify] Iniciando processo de envio de e-mails de aniversário com cartão..."
  );

  // 1. Busca o template de e-mail unificado
  const template = await db.MensagemTemplate.findOne({
    where: { eventoGatilho: "ANIVERSARIO_COM_CARTAO", ativo: true },
  });
  if (!template) {
    console.error(
      '[Notify] Template para gatilho "ANIVERSARIO_COM_CARTAO" não encontrado ou inativo. Abortando tarefa.'
    );
    return;
  }

  // 2. Busca os aniversariantes do dia
  const aniversariantes = await getAniversariantesDoDia();
  if (aniversariantes.length === 0) {
    console.log("[Notify] Nenhum aniversariante hoje. Tarefa concluída.");
    return;
  }

  console.log(
    `[Notify] Encontrados ${aniversariantes.length} aniversariante(s) hoje.`
  );

  // 3. Itera sobre cada aniversariante para gerar o cartão e enviar o e-mail
  for (const aniversariante of aniversariantes) {
    let caminhoPDF = null;
    try {
      if (!aniversariante.emailParaNotificar) {
        console.warn(
          `[Notify] Aniversariante ${aniversariante.nome} não possui e-mail para notificação.`
        );
        continue; // Pula para o próximo
      }

      console.log(`[Notify] Gerando cartão para: ${aniversariante.nome}`);
      caminhoPDF = await gerarCartaoAniversarioPDF(aniversariante);

      const dadosParaTemplate =
        aniversariante.tipo === "Familiar"
          ? {
              ...aniversariante.objetoOriginal.membro,
              familiar: aniversariante.objetoOriginal,
            }
          : aniversariante.objetoOriginal;

      const assunto = hydrateTemplate(template.assunto, dadosParaTemplate);
      const corpo = hydrateTemplate(template.corpo, dadosParaTemplate);

      console.log(
        `[Notify] Enviando e-mail para ${aniversariante.emailParaNotificar}`
      );
      await sendEmail({
        to: aniversariante.emailParaNotificar,
        subject: assunto,
        html: corpo,
        attachments: [
          {
            filename: `Cartao_Aniversario_${aniversariante.nome.replace(
              /\s/g,
              "_"
            )}.pdf`,
            path: caminhoPDF,
            contentType: "application/pdf",
          },
        ],
      });
      console.log(
        `[Notify] E-mail para ${aniversariante.nome} enviado com sucesso.`
      );
    } catch (error) {
      console.error(
        `[Notify] Falha no processo para o aniversariante ${aniversariante.nome}:`,
        error
      );
    } finally {
      // Limpa o ficheiro PDF gerado, independentemente de sucesso ou falha
      if (caminhoPDF) {
        fs.unlink(caminhoPDF, (err) => {
          if (err)
            console.error(
              `[Notify] Erro ao deletar o ficheiro temporário ${caminhoPDF}:`,
              err
            );
        });
      }
    }
  }
  console.log(
    "[Notify] Processo de envio de e-mails de aniversário finalizado."
  );
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
