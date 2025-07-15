// backend/utils/pdfGenerator.js
import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsPath = path.join(__dirname, "..", "assets", "fonts");
const logoPath = path.join(__dirname, "..", "assets", "images", "logoJPJ.png");
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

// Função auxiliar para gerar tabelas com linhas zebradas
const createZebraTable = (table) => ({
  table,
  layout: {
    fillColor: (rowIndex) =>
      rowIndex > 0 && rowIndex % 2 !== 0 ? "#f5f5f5" : null,
    hLineWidth: (i, node) =>
      i === 0 || i === node.table.headerRows || i === node.table.body.length
        ? 1
        : 0.5,
    vLineWidth: (i, node) =>
      i === 0 || i === node.table.widths.length ? 1 : 0,
    hLineColor: () => "#FFFFFF",
    vLineColor: () => "#FFFFFF",
    paddingTop: () => 4,
    paddingBottom: () => 4,
  },
});

/**
 * Gera um documento PDF a partir de uma definição de documento, mantendo o layout padrão.
 * @param {object} docDefinition - A definição do documento no formato do pdfmake.
 * @returns {Promise<Buffer>} - Uma promise que resolve com o buffer do PDF.
 */
export const generatePdf = (docDefinition) => {
  return new Promise((resolve, reject) => {
    const finalDocDefinition = {
      ...docDefinition,
      pageSize: "A4",
      pageMargins: [40, 80, 40, 40],
      background: function (currentPage, pageSize) {
        return {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: pageSize.width,
              h: pageSize.height,
              color: "#b5b5b5",
            },
            {
              type: "rect",
              x: 20,
              y: 20,
              w: pageSize.width - 40,
              h: pageSize.height - 40,
              lineWidth: 2,
              lineColor: "#380404",
            },
          ],
        };
      },
      header: function (currentPage, pageCount, pageSize) {
        return {
          stack: [
            {
              canvas: [
                {
                  type: "rect",
                  x: 20,
                  y: 20,
                  w: pageSize.width - 40,
                  h: 60,
                  color: "#380404",
                },
              ],
            },
            {
              columns: [
                {
                  image: `data:image/png;base64,${logoBase64}`,
                  width: 50,
                  alignment: "left",
                  margin: [40, 0, 0, 0],
                },
                {
                  text: "Loja Maçônica João Pedro Junqueira, nº 2181",
                  style: "headerTitle",
                  alignment: "center",
                  margin: [0, 10, 0, 0],
                  width: "*",
                },
                {
                  width: 50,
                  text: "",
                  margin: [0, 0, 40, 0],
                },
              ],
              absolutePosition: { x: 0, y: 25 },
            },
          ],
        };
      },
      footer: function (currentPage, pageCount) {
        return {
          text: currentPage.toString(),
          alignment: "center",
          margin: [0, 0, 0, 20],
        };
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        ...docDefinition.defaultStyle,
      },
      styles: {
        ...docDefinition.styles,
        headerTitle: {
          fontSize: 18,
          bold: true,
          color: "white",
        },
        header: {
          fontSize: 16,
          bold: true,
          alignment: "center",
          margin: [0, 20, 0, 10],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: "white",
          fillColor: "#380404",
          alignment: "center",
        },
        // --- NOVO ESTILO PARA CÉLULAS DE TABELA ---
        tableCell: {
          fontSize: 9, // Tamanho de fonte reduzido para o corpo das tabelas
          alignment: "left",
        },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", (err) => reject(err));
    pdfDoc.end();
  });
};

// --- FUNÇÕES DE GERAÇÃO DE PDF EXPORTADAS ---

export const gerarPdfMembros = async (members) => {
  const bodyData = members.map((member) => [
    { text: member.CIM || "N/A", style: "tableCell" },
    { text: member.NomeCompleto, style: "tableCell" },
    { text: member.Situacao, style: "tableCell", alignment: "center" },
    { text: member.Graduacao, style: "tableCell", alignment: "center" },
    { text: member.Telefone || "N/A", style: "tableCell" },
    { text: member.Email, style: "tableCell" },
  ]);

  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      { text: "Quadro de Obreiros", style: "header" },
      {
        style: "tableExample",
        ...createZebraTable({
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
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 5, 0, 15] } },
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
    {
      text: new Date(lanc.dataLancamento).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      style: "tableCell",
    },
    { text: lanc.descricao, style: "tableCell" },
    { text: lanc.conta.nome, style: "tableCell" },
    { text: lanc.conta.tipo, style: "tableCell" },
    {
      text: formatCurrency(lanc.valor),
      alignment: "right",
      style: "tableCell",
    },
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
        ...createZebraTable({
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Data", style: "tableHeader" },
              { text: "Descrição", style: "tableHeader" },
              { text: "Conta", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Valor", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
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
    { text: aniv.data, style: "tableCell" },
    { text: aniv.nome, style: "tableCell" },
    { text: aniv.tipo, style: "tableCell" },
  ]);
  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      { text: `Aniversariantes do Mês de ${mes}`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["auto", "*", "*"],
          body: [
            [
              { text: "Data", style: "tableHeader" },
              { text: "Nome", style: "tableHeader" },
              { text: "Relacionamento", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 15, 0, 15] } },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfCargosGestao = async (cargos) => {
  const bodyData = cargos.map((cargo) => [
    { text: cargo.nomeCargo, style: "tableCell" },
    {
      text: cargo.membro ? cargo.membro.NomeCompleto : "Vago",
      style: "tableCell",
    },
    {
      text: new Date(cargo.dataInicio).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      style: "tableCell",
    },
    {
      text: cargo.dataTermino
        ? new Date(cargo.dataTermino).toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "Atual",
      style: "tableCell",
    },
  ]);
  const docDefinition = {
    content: [
      { text: `Relatório de Cargos da Gestão Atual`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body: [
            [
              { text: "Cargo", style: "tableHeader" },
              { text: "Ocupante", style: "tableHeader" },
              { text: "Data de Início", style: "tableHeader" },
              { text: "Data de Término", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 15, 0, 15] } },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfComissoes = async (comissoes) => {
  const content = [{ text: "Relatório de Comissões", style: "header" }];
  comissoes.forEach((comissao) => {
    content.push({ text: comissao.nome, style: "comissaoTitle" });
    if (comissao.membros && comissao.membros.length > 0) {
      const bodyData = comissao.membros.map((membro) => [
        { text: membro.NomeCompleto, style: "tableCell" },
        {
          text: membro.MembroComissao ? membro.MembroComissao.cargo : "Membro",
          style: "tableCell",
        },
      ]);
      content.push({
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["*", "auto"],
          body: [
            [
              { text: "Nome do Membro", style: "tableHeader" },
              { text: "Cargo na Comissão", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
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
    },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfDatasMaconicas = async (datas, mes) => {
  const bodyData = datas.map((item) => [
    { text: item.data, style: "tableCell" },
    { text: item.nome, style: "tableCell" },
    { text: item.tipo, style: "tableCell" },
    { text: item.anosComemorados, style: "tableCell" },
  ]);
  const docDefinition = {
    content: [
      { text: `Relatório de Datas Maçônicas - ${mes}`, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Data", style: "tableHeader" },
              { text: "Nome do Irmão", style: "tableHeader" },
              { text: "Aniversário de", style: "tableHeader" },
              { text: "Anos", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 15, 0, 15] } },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfEmprestimos = async (emprestimos) => {
  const title = "Relatório de Empréstimos Ativos da Biblioteca";
  const bodyData = emprestimos.map((emp) => [
    { text: emp.livro ? emp.livro.titulo : "N/A", style: "tableCell" },
    { text: emp.membro ? emp.membro.NomeCompleto : "N/A", style: "tableCell" },
    {
      text: new Date(emp.dataEmprestimo).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      style: "tableCell",
    },
    {
      text: new Date(emp.dataDevolucaoPrevista).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      style: "tableCell",
    },
    {
      text: emp.dataDevolucaoReal
        ? new Date(emp.dataDevolucaoReal).toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "Pendente",
      style: "tableCell",
    },
  ]);
  const docDefinition = {
    content: [
      { text: title, style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Título", style: "tableHeader" },
              { text: "Membro", style: "tableHeader" },
              { text: "Empréstimo", style: "tableHeader" },
              { text: "Dev. Prevista", style: "tableHeader" },
              { text: "Devolvido em", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 15, 0, 15] } },
  };
  return generatePdf(docDefinition);
};

export const gerarPdfFrequencia = async (
  dadosFrequencia,
  dataInicio,
  dataFim
) => {
  const bodyData = dadosFrequencia.map((item) => [
    { text: item.nome, style: "tableCell" },
    { text: item.presencas, style: "tableCell", alignment: "center" },
    { text: item.totalSessoes, style: "tableCell", alignment: "center" },
    {
      text: `${item.percentual.toFixed(2)}%`,
      style: "tableCell",
      alignment: "center",
    },
  ]);
  const docDefinition = {
    content: [
      { text: "Relatório de Frequência em Sessões", style: "header" },
      { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nome do Membro", style: "tableHeader" },
              { text: "Presenças", style: "tableHeader" },
              { text: "Total de Sessões", style: "tableHeader" },
              { text: "Frequência", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
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
    {
      text: new Date(item.dataSessao).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      style: "tableCell",
    },
    { text: item.visitante.NomeCompleto, style: "tableCell" },
    {
      text: item.loja
        ? `${item.loja.nome}, nº ${item.loja.numero || "S/N"}`
        : "Loja não informada",
      style: "tableCell",
    },
    {
      text: item.loja
        ? `${item.loja.cidade || ""}/${item.loja.estado || ""}`
        : "",
      style: "tableCell",
    },
    { text: item.tipoSessao, style: "tableCell" },
  ]);

  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      { text: "Relatório de Visitações", style: "header" },
      { text: `Período: ${dataInicio} a ${dataFim}`, style: "subheader" },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["auto", "*", "*", "auto", "*"],
          body: [
            [
              { text: "Data", style: "tableHeader" },
              { text: "Membro Visitante", style: "tableHeader" },
              { text: "Loja Visitada", style: "tableHeader" },
              { text: "Oriente", style: "tableHeader" },
              { text: "Tipo de Sessão", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
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
    { text: item.nome, style: "tableCell" },
    { text: item.quantidade, style: "tableCell", alignment: "center" },
    { text: item.estadoConservacao, style: "tableCell" },
    { text: item.localizacao || "N/A", style: "tableCell" },
  ]);
  const docDefinition = {
    content: [
      { text: "Relatório de Patrimônio", style: "header" },
      { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}` },
      {
        style: "tableExample",
        ...createZebraTable({
          headerRows: 1,
          widths: ["*", "auto", "auto", "*"],
          body: [
            [
              { text: "Item", style: "tableHeader" },
              { text: "Qtd.", style: "tableHeader" },
              { text: "Estado", style: "tableHeader" },
              { text: "Localização", style: "tableHeader" },
            ],
            ...bodyData,
          ],
        }),
      },
    ],
    styles: { tableExample: { margin: [0, 15, 0, 15] } },
  };
  return generatePdf(docDefinition);
};
