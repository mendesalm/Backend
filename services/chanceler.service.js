// backend/services/chanceler.service.js
import db from "../models/index.js";
import { createCartaoAniversarioFromTemplate } from "./googleDocs.service.js";
import { Op } from "sequelize";

// Função auxiliar para normalizar uma data para um ano comum para comparação
const normalizeDateForYear = (date, year) => {
  if (!date) return null;
  const d = new Date(date);
  d.setUTCFullYear(year);
  return d;
};

/**
 * Busca e agrupa todos os aniversários (civis e maçônicos) em um período.
 * @param {Date} dataInicio - A data de início do período.
 * @param {Date} dataFim - A data de fim do período.
 * @returns {Promise<object>} Objeto com as listas de aniversariantes.
 */
export const getChancelerPanelData = async (dataInicio, dataFim) => {
  const anoAtual = new Date().getFullYear();

  // 1. Busca todos os membros com situações permitidas e seus familiares não falecidos
  const membros = await db.LodgeMember.findAll({
    where: { Situacao: { [Op.notIn]: ["Inativo", "Irregular"] } },
    include: [
      {
        model: db.FamilyMember,
        as: "familiares",
        where: { falecido: false },
        required: false,
      },
    ],
  });

  const aniversariosCivis = [];
  const aniversariosMaconicos = [];
  const aniversariosCasamento = [];

  // 2. Itera sobre cada membro para verificar todas as datas comemorativas
  for (const membro of membros) {
    const datas = [
      {
        tipo: "Aniversário do Irmão",
        data: membro.DataNascimento,
        nome: membro.NomeCompleto,
        email: membro.Email,
        id: `membro-${membro.id}`,
      },
      {
        tipo: "Iniciação",
        data: membro.DataIniciacao,
        nome: membro.NomeCompleto,
        email: membro.Email,
        id: `membro-${membro.id}`,
      },
      {
        tipo: "Elevação",
        data: membro.DataElevacao,
        nome: membro.NomeCompleto,
        email: membro.Email,
        id: `membro-${membro.id}`,
      },
      {
        tipo: "Exaltação",
        data: membro.DataExaltacao,
        nome: membro.NomeCompleto,
        email: membro.Email,
        id: `membro-${membro.id}`,
      },
      {
        tipo: "Casamento",
        data: membro.DataCasamento,
        nome: membro.NomeCompleto,
        email: membro.Email,
        id: `membro-${membro.id}`,
      },
    ];

    if (membro.familiares) {
      membro.familiares.forEach((familiar) => {
        datas.push({
          tipo: `Aniversário (${familiar.parentesco})`,
          data: familiar.dataNascimento,
          nome: familiar.nomeCompleto,
          email: membro.Email,
          id: `familiar-${familiar.id}`,
        });
      });
    }

    // 3. Filtra e processa cada data
    for (const item of datas) {
      if (!item.data) {
        continue;
      }

      const dataOriginal = new Date(item.data);
      const dataNormalizada = normalizeDateForYear(
        dataOriginal,
        dataInicio.getUTCFullYear()
      );

      if (
        dataInicio.getUTCFullYear() !== dataFim.getUTCFullYear() &&
        dataNormalizada < dataInicio
      ) {
        dataNormalizada.setUTCFullYear(dataFim.getUTCFullYear());
      }

      if (dataNormalizada >= dataInicio && dataNormalizada <= dataFim) {
        const anos = anoAtual - dataOriginal.getUTCFullYear();
        const evento = {
          id: item.id,
          nome: item.nome,
          data: dataOriginal.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
          }),
          anos: anos > 0 ? `${anos} ano(s)` : "",
        };

        if (item.tipo.includes("Aniversário")) {
          aniversariosCivis.push({ ...evento, tipo: item.tipo });
        } else if (item.tipo === "Casamento") {
          aniversariosCasamento.push({ ...evento, tipo: item.tipo });
        } else {
          aniversariosMaconicos.push({ ...evento, tipo: item.tipo });
        }
      }
    }
  }

  // 4. Ordena cada lista por data
  const sortByDate = (a, b) => {
    const [diaA, mesA] = a.data.split("/");
    const [diaB, mesB] = b.data.split("/");
    return new Date(`1900-${mesA}-${diaA}`) - new Date(`1900-${mesB}-${diaB}`);
  };
  aniversariosCivis.sort(sortByDate);
  aniversariosMaconicos.sort(sortByDate);
  aniversariosCasamento.sort(sortByDate);

  return { aniversariosCivis, aniversariosMaconicos, aniversariosCasamento };
};

/**
 * Prepara os dados e chama o serviço do Google Docs para gerar o PDF do cartão.
 */
export const gerarCartaoAniversarioPDF = async (aniversariante) => {
  try {
    const hoje = new Date();
    const dataFormatada = new Date(
      aniversariante.dataNascimento
    ).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });

    const placeholders = {
      NOME_ANIVERSARIANTE: aniversariante.nome,
      DATA_ANIVERSARIO: dataFormatada,
      ANO_ATUAL: hoje.getFullYear().toString(),
    };

    const resultado = await createCartaoAniversarioFromTemplate(placeholders);
    if (!resultado || !resultado.pdfPath) {
      throw new Error(
        "Falha ao obter o caminho do PDF gerado pelo googleDocs.service."
      );
    }

    return resultado.pdfPath;
  } catch (error) {
    console.error(
      "Erro no serviço do Chanceler ao gerar cartão de aniversário:",
      error
    );
    throw error;
  }
};
