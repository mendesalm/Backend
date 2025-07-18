import db from "../models/index.js";
import { getNextNumber } from "./numbering.service.js";
import { readFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para converter imagem em base64
const imageToBase64 = (imgPath) => {
  const absolutePath = path.resolve(__dirname, "..", imgPath);
  if (!existsSync(absolutePath)) {
    console.warn(`Imagem não encontrada: ${absolutePath}`);
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  const imageData = readFileSync(absolutePath);
  let contentType = "application/octet-stream";
  if (imgPath.endsWith(".png")) contentType = "image/png";
  else if (imgPath.endsWith(".jpg") || imgPath.endsWith(".jpeg"))
    contentType = "image/jpeg";
  return `data:${contentType};base64,${imageData.toString("base64")}`;
};

// Função auxiliar para preparar o conteúdo HTML com dados e fontes
const prepareHtmlForPdf = (templateName, data) => {
  let templatePath;
  if (templateName === "convite_participacao") {
    templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.html`
    );
  } else {
    templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "pdf",
      `${templateName}.html`
    );
  }
  let htmlContent = readFileSync(templatePath, "utf8");

  const poppinsRegularBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "Poppins-Regular.ttf")
  ).toString("base64");
  const poppinsBoldBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "Poppins-Bold.ttf")
  ).toString("base64");
  const openSansRegularBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "OpenSans-Regular.ttf")
  ).toString("base64");
  const openSansBoldBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "OpenSans-Bold.ttf")
  ).toString("base64");
  const oleoScriptRegularBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "OleoScript-Regular.ttf")
  ).toString("base64");
  const oleoScriptBoldBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "OleoScript-Bold.ttf")
  ).toString("base64");
  const greatVibesRegularBase64 = readFileSync(
    path.join(__dirname, "..", "assets", "fonts", "GreatVibes-Regular.ttf")
  ).toString("base64");

  const fontStyles = `
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Great Vibes"; src: url("data:font/truetype;charset=utf-8;base64,${greatVibesRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
    `;
  htmlContent = htmlContent.replace("</style>", `${fontStyles}</style>`);

  data.headerImage = imageToBase64("assets/images/logoJPJ_.png");
  data.footerImage = imageToBase64("assets/images/logoRB_.png");
  data.backgroundImage = imageToBase64("assets/images/cartao_fundo.svg");

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    htmlContent = htmlContent.replace(regex, String(value ?? ""));
  });

  return htmlContent;
};

// Função para sanitizar o título para usar como nome de arquivo
const sanitizeTitleForFilename = (title) => {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
};

/**
 * [ISOLADA] Gera o PDF de um Balaústre com suas configurações específicas.
 */
async function generateBalaustrePdf(data) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const htmlContent = prepareHtmlForPdf("balaustre", data);

  const pdfDir = path.join(process.cwd(), "uploads", "balaustres");
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

  const pdfFileName = `balaustre_${data.NumeroBalaustre}_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfFilePath,
    format: "A4",
    printBackground: true,
    margin: { top: "1cm", right: "1.5cm", bottom: "1cm", left: "1.5cm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `<div style="position: absolute; top: 1cm; left: 1.5cm; right: 1.5cm; bottom: 1cm; border: 1pt solid #800; pointer-events: none;"></div>
                         <div style="position: absolute; bottom: 0.5cm; left: 0; right: 0; text-align: center; font-size: 10px;">
                             <div style="display: inline-flex; justify-content: center; align-items: center; width: 8mm; height: 8mm; border-radius: 50%; border: 1px solid #800; background-color: #f0f0f0; color: #333;">
                                 <span class="pageNumber"></span> / <span class="totalPages"></span>
                             </div>
                         </div>`,
  });

  await browser.close();
  const relativePath = path
    .join("uploads", "balaustres", pdfFileName)
    .replace(/\\/g, "/");
  return { pdfPath: `/${relativePath}` };
}

/**
 * [ISOLADA] Gera o PDF de um Edital de Convocação com suas configurações específicas.
 */
async function generateEditalPdf(data) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const htmlContent = prepareHtmlForPdf("edital", data);

  const pdfDir = path.join(process.cwd(), "uploads", "editais");
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

  const pdfFileName = `edital_${data.NumeroBalaustre}_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfFilePath,
    format: "A4",
    printBackground: true,
    margin: { top: "1cm", right: "1.5cm", bottom: "1cm", left: "1.5cm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `<div style="position: absolute; top: 1cm; left: 1.5cm; right: 1.5cm; bottom: 1cm; border: 1pt solid #800; pointer-events: none;"></div>
                         <div style="position: absolute; bottom: 0.5cm; left: 0; right: 0; text-align: center; font-size: 10px;">
                             <div style="display: inline-flex; justify-content: center; align-items: center; width: 8mm; height: 8mm; border-radius: 50%; border: 1px solid #800; background-color: #f0f0f0; color: #333;">
                                 <span class="pageNumber"></span> / <span class="totalPages"></span>
                             </div>
                         </div>`,
  });

  await browser.close();
  const relativePath = path
    .join("uploads", "editais", pdfFileName)
    .replace(/\\/g, "/");
  return { pdfPath: `/${relativePath}` };
}

/**
 * [ISOLADA] Gera o PDF de um Cartão de Aniversário com suas configurações específicas.
 */
async function generateCartaoPdf(data) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const htmlContent = prepareHtmlForPdf("cartao_aniversario", data);

  const pdfDir = path.join(process.cwd(), "uploads", "cartoes_aniversario");
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

  const title = `Cartão de Aniversário - ${data.NOME_ANIVERSARIANTE}`;
  const pdfFileName = `${sanitizeTitleForFilename(title)}.pdf`; // Timestamp removido
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfFilePath,
    width: "1920px",
    height: "1080px",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  const relativePath = path
    .join("uploads", "cartoes_aniversario", pdfFileName)
    .replace(/\\/g, "/");
  return { pdfPath: `/${relativePath}` };
}

/**
 * [ISOLADA] Gera o PDF de um Convite de Participação com suas configurações específicas.
 */
async function generateConvitePdf(data) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const htmlContent = prepareHtmlForPdf("convite_participacao", data);

  const pdfDir = path.join(process.cwd(), "uploads", "convites");
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

  const pdfFileName = `convite_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfFilePath,
    format: "A5",
    landscape: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  const relativePath = path
    .join("uploads", "convites", pdfFileName)
    .replace(/\\/g, "/");
  return { pdfPath: `/${relativePath}` };
}

// --- Funções Públicas de Orquestração ---

export async function createBalaustreFromTemplate(data, masonicSessionId) {
  const transaction = await db.sequelize.transaction();
  try {
    const nextBalaustreNumber = await getNextNumber("balaustre", transaction);
    data.NumeroBalaustre = nextBalaustreNumber;
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao obter o próximo número de balaústre:", error);
    throw error;
  }

  const cargoPlaceholderMapping = {
    "Venerável Mestre": "Veneravel",
    "Primeiro Vigilante": "PrimeiroVigilante",
    "Segundo Vigilante": "SegundoVigilante",
    Orador: "Orador",
    Secretário: "Secretario",
    Tesoureiro: "Tesoureiro",
    Chanceler: "Chanceler",
  };

  if (masonicSessionId) {
    const attendees = await db.SessionAttendee.findAll({
      where: { sessionId: masonicSessionId },
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          include: [
            {
              model: db.CargoExercido,
              as: "cargos",
              where: { dataTermino: null },
              required: false,
            },
          ],
        },
      ],
    });
    attendees.forEach((attendee) => {
      attendee.membro?.cargos?.forEach((cargo) => {
        const placeholder = cargoPlaceholderMapping[cargo.nomeCargo];
        if (placeholder && !data[placeholder]) {
          data[placeholder] = attendee.membro.NomeCompleto;
        }
      });
    });
  }

  const processedData = prepareDataForBalaustre(data);
  const pdfResult = await generateBalaustrePdf(processedData);
  return pdfResult;
}

export async function createEditalFromTemplate(editalData) {
  const transaction = await db.sequelize.transaction();
  try {
    const nextEditalNumber = await getNextNumber("edital", transaction);
    editalData.NumeroBalaustre = nextEditalNumber; // Reusing NumeroBalaustre for edital number
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao obter o próximo número de edital:", error);
    throw error;
  }
  const pdfResult = await generateEditalPdf(editalData);
  return pdfResult;
}

export async function createCartaoAniversarioFromTemplate(
  aniversarianteData,
  subtipoMensagem
) {
  // A lógica para buscar dados do BD foi movida para o controller/serviço que chama esta função.
  // Esta função agora foca apenas na geração do PDF com os dados recebidos.
  return generateCartaoPdf(aniversarianteData);
}

export async function createConviteFromTemplate(conviteData) {
  const pdfResult = await generateConvitePdf(conviteData);
  return pdfResult;
}

const prepareDataForBalaustre = (d) => {
  const processed = { ...d };
  const allTemplateFields = [
    "NumeroBalaustre",
    "ClasseSessao_Titulo",
    "HoraInicioSessao",
    "DiaSessao",
    "ClasseSessao_Corpo",
    "NumeroIrmaosQuadro",
    "NumeroVisitantes",
    "Veneravel",
    "PrimeiroVigilante",
    "SegundoVigilante",
    "Orador",
    "Secretario",
    "Tesoureiro",
    "Chanceler",
    "DataSessaoAnterior",
    "EmendasBalaustreAnterior",
    "ExpedienteRecebido",
    "ExpedienteExpedido",
    "SacoProposta",
    "OrdemDia",
    "Escrutinio",
    "TempoInstrucao",
    "TroncoBeneficiencia",
    "Palavra",
    "HoraEncerramento",
    "DataAssinatura",
    "Emendas",
  ];
  allTemplateFields.forEach((field) => {
    if (!(field in processed)) {
      processed[field] = "";
    }
  });
  const uppercaseFields = [
    "Veneravel",
    "PrimeiroVigilante",
    "SegundoVigilante",
    "Orador",
    "Secretario",
    "Tesoureiro",
    "Chanceler",
  ];
  uppercaseFields.forEach((field) => {
    if (processed[field]) {
      processed[field] = String(processed[field]).toUpperCase();
    }
  });
  if (d.ClasseSessao) {
    processed.ClasseSessao_Titulo = String(d.ClasseSessao).toUpperCase();
    processed.ClasseSessao_Corpo = String(d.ClasseSessao).toLowerCase();
    delete processed.ClasseSessao;
  } else {
    if (d.ClasseSessao_Titulo) {
      processed.ClasseSessao_Titulo = String(
        d.ClasseSessao_Titulo
      ).toUpperCase();
    }
    if (d.ClasseSessao_Corpo) {
      processed.ClasseSessao_Corpo = String(d.ClasseSessao_Corpo).toLowerCase();
    }
  }
  return processed;
};

export async function deleteLocalFile(filePath) {
  if (!filePath) return;
  try {
    const absolutePath = path.join(
      process.cwd(),
      filePath.startsWith("/") ? filePath.substring(1) : filePath
    );
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
      console.log(
        `[PDFService] Arquivo local deletado com sucesso: ${absolutePath}`
      );
    }
  } catch (error) {
    console.warn(
      `[PDFService] Aviso ao deletar arquivo local ${filePath}: ${error.message}`
    );
  }
}
