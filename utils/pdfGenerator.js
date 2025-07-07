// backend/utils/pdfGenerator.js
import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsPath = path.join(__dirname, "..", "assets", "fonts");
const logoPath = path.join(
  __dirname,
  "..",
  "assets",
  "images",
  "logoJPJ.png"
);
const logoBase64 = fs.readFileSync(logoPath).toString("base64");

const fonts = {
  Roboto: {
    normal: path.join(fontsPath, "Roboto-Regular.ttf"),
    bold: path.join(fontsPath, "Roboto-Bold.ttf"),
    italics: path.join(fontsPath, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsPath, "Roboto-BoldItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

/**
 * Gera um documento PDF a partir de uma definição de documento.
 * @param {object} docDefinition - A definição do documento no formato do pdfmake.
 * @returns {Promise<Buffer>} - Uma promise que resolve com o buffer do PDF.
 */
export const generatePdf = (docDefinition) => {
  return new Promise((resolve, reject) => {
    const finalDocDefinition = {
      ...docDefinition,
      pageSize: "A4",
      pageMargins: [40, 80, 40, 60], // [left, top, right, bottom]
      background: function (currentPage, pageSize) {
        return {
          canvas: [
            {
              type: "rect",
              x: 20,
              y: 20,
              w: pageSize.width - 40,
              h: pageSize.height - 40,
              lineWidth: 1,
              lineColor: "#cccccc",
            },
          ],
          backgroundColor: "#f5f5f5", // Cinza claro
        };
      },
      header: function (currentPage, pageCount, pageSize) {
        return {
          columns: [
            {
              image: `data:image/png;base64,${logoBase64}`,
              width: 50,
              alignment: "left",
              margin: [40, 20, 0, 0],
            },
            {
              text: "Loja Maçônica João Pedro Junqueira, nº 2181",
              style: "headerTitle",
              alignment: "center",
              margin: [0, 30, 0, 0],
              width: "*",
            },
            {
              width: 50, // Espaço à direita para manter o título centralizado
              text: "",
              margin: [0, 0, 40, 0],
            },
          ],
        };
      },
      footer: function (currentPage, pageCount) {
        return {
          text: currentPage.toString(),
          alignment: "center",
          margin: [0, 0, 0, 20], // Margem para o rodapé
        };
      },
      defaultStyle: {
        font: "Roboto",
        ...docDefinition.defaultStyle,
      },
      styles: {
        ...docDefinition.styles,
        headerTitle: {
          fontSize: 18,
          bold: true,
        },
        header: {
          fontSize: 16,
          bold: true,
          alignment: "center",
          margin: [0, 20, 0, 10],
        },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(finalDocDefinition);

    const chunks = [];
    pdfDoc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });

    pdfDoc.on("error", (err) => {
      reject(err);
    });

    pdfDoc.end();
  });
};

// --- FUNÇÕES DE GERAÇÃO DE PDF EXPORTADAS ---

/**
 * Nomeado para consistência com o controller.
 */
export const gerarPdfMembros = async (members) => {
  const bodyData = members.map((member) => [
    member.CIM || "N/A",
    member.NomeCompleto,
    member.Situacao,
    member.Graduacao,
    member.Telefone || "N/A",
    member.Email,
  ]);

  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      { text: "Quadro de Obreiros", style: "header" }, // Título alterado
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "CIM", style: "tableHeader" },
              { text: "Nome Completo", style: "tableHeader" },
              { text: "Situação", style: "tableHeader" },
              { text: "Grau", style: "tableHeader" },
              { text: "Telefone", style: "tableHeader" },
              { text: "E-mail", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        },
      },
    ],
    styles: {
      tableExample: { margin: [0, 5, 0, 15] },
      tableHeader: { bold: true, alignment: "center" },
    },
  };

  return generatePdf(docDefinition);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

export const gerarPdfBalancete = async (balanceteData) => {
  const { totais, lancamentos, periodo } = balanceteData;
  const bodyData = lancamentos.map((lanc) => [
    new Date(lanc.data).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    lanc.descricao,
    lanc.conta.nome,
    lanc.tipo,
    { text: formatCurrency(lanc.valor), alignment: "right" },
  ]);
  const docDefinition = {
    content: [
      { text: "Balancete Financeiro", style: "header" },
      {
        text: `Período: ${periodo.inicio} a ${periodo.fim}`,
        style: "subheader",
      },
      {
        style: "tableExample",
        layout: "noBorders",
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Total de Entradas:", bold: true },
              {
                text: formatCurrency(totais.totalEntradas),
                alignment: "right",
              },
            ],
            [
              { text: "Total de Saídas:", bold: true },
              { text: formatCurrency(totais.totalSaidas), alignment: "right" },
            ],
            [
              { text: "Saldo do Período:", bold: true, fontSize: 14 },
              {
                text: formatCurrency(totais.saldoPeriodo),
                bold: true,
                fontSize: 14,
                alignment: "right",
              },
            ],
          ],
        },
      },
      { text: "Lançamentos Detalhados", style: "subheader" },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: [["Data", "Descrição", "Conta", "Tipo", "Valor"], ...bodyData],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      tableExample: { margin: [0, 5, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfAniversariantes = async (aniversariantes, mes) => {
  const bodyData = aniversariantes.map((aniv) => [
    aniv.data,
    aniv.nome,
    aniv.tipo,
  ]);
  const docDefinition = {
    pageOrientation: "landscape", // Adicionado para formato paisagem
    content: [
      { text: `Relatório de Aniversariantes - ${mes}`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto"],
          body: [["Data", "Nome", "Tipo (Membro/Familiar)"], ...bodyData],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      tableExample: { margin: [0, 15, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfCargosGestao = async (cargos) => {
  const bodyData = cargos.map((cargo) => [
    cargo.nomeCargo,
    cargo.membro ? cargo.membro.NomeCompleto : "Vago",
    new Date(cargo.dataInicio).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    cargo.dataTermino
      ? new Date(cargo.dataTermino).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' })
      : "Atual",
  ]);
  const docDefinition = {
    content: [
      { text: `Relatório de Cargos da Gestão Atual`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body: [
            ["Cargo", "Ocupante", "Data de Início", "Data de Término"],
            ...bodyData,
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      tableExample: { margin: [0, 15, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfComissoes = async (comissoes, dataInicio, dataFim) => {
  const content = [
    { text: "Relatório de Comissões", style: "header" },
    { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
  ];
  comissoes.forEach((comissao) => {
    content.push({ text: comissao.nome, style: "comissaoTitle" });
    if (comissao.membros && comissao.membros.length > 0) {
      const bodyData = comissao.membros.map((membro) => [
        membro.NomeCompleto,
        membro.MembroComissao ? membro.MembroComissao.cargo : "Membro",
      ]);
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto"],
          body: [
            [
              { text: "Nome do Membro", style: "tableHeader" },
              { text: "Cargo na Comissão", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        },
        layout: "lightHorizontalLines",
      });
    } else {
      content.push({
        text: "Nenhum membro nesta comissão.",
        italics: true,
        margin: [0, 5, 0, 15],
      });
    }
  });
  const docDefinition = {
    content: content,
    styles: {
      subheader: { fontSize: 10, margin: [0, 0, 0, 20], alignment: "center" },
      comissaoTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 15, 0, 5],
        color: "#333",
      },
      tableExample: { margin: [0, 5, 0, 15] },
      tableHeader: { bold: true, color: "black" },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfDatasMaconicas = async (datas, mes) => {
  const bodyData = datas.map((item) => [
    item.data,
    item.nome,
    item.tipo,
    item.anosComemorados,
  ]);
  const docDefinition = {
    content: [
      { text: `Relatório de Datas Maçônicas - ${mes}`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto"],
          body: [
            ["Data", "Nome do Irmão", "Aniversário de", "Anos"],
            ...bodyData,
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      tableExample: { margin: [0, 15, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfEmprestimos = async (emprestimos, tipo, livro) => {
  const title =
    tipo === "ativos"
      ? "Relatório de Empréstimos Ativos da Biblioteca"
      : `Histórico de Empréstimos do Livro: ${livro.titulo}`;
  const bodyData = emprestimos.map((emp) => [
    emp.livro ? emp.livro.titulo : "N/A",
    emp.membro ? emp.membro.NomeCompleto : "N/A",
    new Date(emp.dataEmprestimo).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    new Date(emp.dataDevolucaoPrevista).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    emp.dataDevolucaoReal
      ? new Date(emp.dataDevolucaoReal).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' })
      : "Pendente",
  ]);
  const docDefinition = {
    content: [
      { text: title, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            ["Título", "Membro", "Empréstimo", "Dev. Prevista", "Devolvido em"],
            ...bodyData,
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      tableExample: { margin: [0, 15, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfFrequencia = async (
  dadosFrequencia,
  dataInicio,
  dataFim
) => {
  const bodyData = dadosFrequencia.map((item) => [
    item.nome,
    item.presencas,
    item.totalSessoes,
    `${item.percentual.toFixed(2)}%`,
  ]);
  const docDefinition = {
    content: [
      { text: "Relatório de Frequência em Sessões", style: "header" },
      { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            ["Nome do Membro", "Presenças", "Total de Sessões", "Frequência"],
            ...bodyData,
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      subheader: { fontSize: 12, margin: [0, 0, 0, 15], alignment: "center" },
      tableExample: { margin: [0, 5, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfVisitacoes = async (visitacoes, dataInicio, dataFim) => {
  const bodyData = visitacoes.map((item) => [
    new Date(item.dataSessao).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    item.visitante.NomeCompleto,
    item.lojaVisitada,
  ]);
  const docDefinition = {
    content: [
      { text: "Relatório de Visitações", style: "header" },
      { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*"],
          body: [["Data", "Membro Visitante", "Loja Visitada"], ...bodyData],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      subheader: { fontSize: 12, margin: [0, 0, 0, 15], alignment: "center" },
      tableExample: { margin: [0, 5, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfFinanceiroDetalhado = async (
  conta,
  lancamentos,
  dataInicio,
  dataFim
) => {
  const bodyData = lancamentos.map((lanc) => [
    new Date(lanc.dataLancamento).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' }),
    lanc.descricao,
    lanc.tipo,
    { text: formatCurrency(lanc.valor), alignment: "right" },
  ]);
  const docDefinition = {
    content: [
      { text: `Extrato da Conta: ${conta.nome}`, style: "header" },
      { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto"],
          body: [["Data", "Descrição", "Tipo", "Valor"], ...bodyData],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      subheader: { fontSize: 12, margin: [0, 0, 0, 15], alignment: "center" },
      tableExample: { margin: [0, 5, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfPatrimonio = async (itens) => {
  const bodyData = itens.map((item) => [
    item.nome,
    item.quantidade,
    item.estadoConservacao,
    item.localizacao || "N/A",
  ]);
  const docDefinition = {
    content: [
      { text: "Relatório de Patrimônio", style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "*"],
          body: [["Item", "Qtd.", "Estado", "Localização"], ...bodyData],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      tableExample: { margin: [0, 15, 0, 15] },
    },
  };
  return generatePdf(docDefinition);
};
