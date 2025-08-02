import db from "../models/index.js";
import { getNextNumber } from "./numbering.service.js";
import {
  readFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import * as fs from "fs";
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
  else if (imgPath.endsWith(".svg")) {
    contentType = "image/svg+xml";
    const svgContent = imageData.toString("utf8");
    return `data:${contentType},${encodeURIComponent(svgContent)}`;
  }
  return `data:${contentType};base64,${imageData.toString("base64")}`;
};

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

  let fontStyles = "";
  if (templateName === "convite_participacao") {
    // Carregar a fonte Oleo Script para o convite, conforme solicitado
    const oleoScriptBoldBase64 = readFileSync(
      path.join(__dirname, "..", "assets", "fonts", "OleoScript-Bold.ttf")
    ).toString("base64");
    const oleoScriptRegularBase64 = readFileSync(
      path.join(__dirname, "..", "assets", "fonts", "OleoScript-Regular.ttf")
    ).toString("base64");

    let fontStyles = "";
    if (templateName === "convite_participacao") {
      fontStyles = `
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
    `;
      data.convite_image = imageToBase64("assets/images/convite.png");
      htmlContent = htmlContent.replace("</style>", `${fontStyles}</style>`);
    } else {
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
      const greatVibesRegularBase64 = readFileSync(
        path.join(__dirname, "..", "assets", "fonts", "GreatVibes-Regular.ttf")
      ).toString("base64");
      fontStyles = `
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Great Vibes"; src: url("data:font/truetype;charset=utf-8;base64,${greatVibesRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
    `;
      htmlContent = htmlContent.replace("</style>", `${fontStyles}</style>`);
    }
  } else {
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
    fontStyles = `
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Poppins"; src: url("data:font/truetype;charset=utf-8;base64,${poppinsBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Open Sans"; src: url("data:font/truetype;charset=utf-8;base64,${openSansBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
      @font-face { font-family: "Oleo Script"; src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptBoldBase64}") format("truetype"); font-weight: bold; font-style: normal; }
      @font-face { font-family: "Great Vibes"; src: url("data:font/truetype;charset=utf-8;base64,${greatVibesRegularBase64}") format("truetype"); font-weight: normal; font-style: normal; }
    `;
    htmlContent = htmlContent.replace("</style>", `${fontStyles}</style>`);
  }

  data.header_image = imageToBase64("assets/images/logoJPJ_.png");
  data.footer_image = imageToBase64("assets/images/logoRB_.png");
  data.background_image = imageToBase64("assets/images/cartao_fundo.svg");

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{2,3}${key}}{2,3}`, "g");
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

  const pdfFileName = `balaustre_${data.numero_balaustre}_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);
  const tempPdfFilePath = path.join(
    pdfDir,
    `temp_${Date.now()}_${pdfFileName}`
  );

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: tempPdfFilePath,
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

  // Renomeia o arquivo temporário para o nome final
  await new Promise((resolve, reject) => {
    fs.rename(tempPdfFilePath, pdfFilePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
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

  const pdfFileName = `edital_${data.numero_balaustre}_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);
  const tempPdfFilePath = path.join(
    pdfDir,
    `temp_${Date.now()}_${pdfFileName}`
  );

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: tempPdfFilePath,
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

  // Renomeia o arquivo temporário para o nome final
  await new Promise((resolve, reject) => {
    fs.rename(tempPdfFilePath, pdfFilePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
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

  const title = `Cartão de Aniversário - ${data.nome_aniversariante}`;
  const pdfFileName = `${sanitizeTitleForFilename(title)}.pdf`; // Timestamp removido
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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
    ], // Mantido apenas o essencial para compatibilidade
  });
  const page = await browser.newPage();
  const processedData = prepareDataForConvite(data);
  const htmlContent = prepareHtmlForPdf("convite_participacao", processedData);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfDir = path.join(process.cwd(), "uploads", "convites");
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

  const pdfFileName = `convite_${data.formattedDateForFilename}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);
  const tempPdfFilePath = path.join(
    pdfDir,
    `temp_${Date.now()}_${pdfFileName}`
  );

  try {
    await page.pdf({
      path: tempPdfFilePath,
      format: "A5",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
  } catch (error) {
    console.error("[ERROR] Falha ao gerar PDF:", error);
    throw error; // Propaga o erro para depuração
  }

  // Renomeia o arquivo temporário para o nome final
  await new Promise((resolve, reject) => {
    fs.rename(tempPdfFilePath, pdfFilePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await browser.close();
  const relativePath = path
    .join("uploads", "convites", pdfFileName)
    .replace(/\\/g, "/");
  return { pdfPath: `/${relativePath}` };
}

// --- Funções Públicas de Orquestração ---

export async function createBalaustreFromTemplate(
  data,
  masonicSessionId,
  sessionNumber
) {
  data.numero_balaustre = sessionNumber;

  const cargoPlaceholderMapping = {
    "Venerável Mestre": "veneravel",
    "Primeiro Vigilante": "primeiro_vigilante",
    "Segundo Vigilante": "segundo_vigilante",
    Orador: "orador",
    Secretário: "secretario",
    Tesoureiro: "tesoureiro",
    Chanceler: "chanceler",
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
  const pdfResult = await regenerateBalaustrePdf(null, processedData);

  // Crie a entrada do balaústre no banco de dados
  const createdBalaustre = await db.Balaustre.create({
    numero: processedData.numero_balaustre,
    ano: new Date().getFullYear(), // Ou extraia de 'data' se disponível
    path: pdfResult.pdfPath,
    caminhoPdfLocal: pdfResult.pdfPath,
    dadosFormulario: data,
    MasonicSessionId: masonicSessionId,
    status: "Minuta",
    assinaturas: {},
  });

  return createdBalaustre;
}

export async function regenerateBalaustrePdf(balaustreId, data) {
  const balaustre = balaustreId
    ? await db.Balaustre.findByPk(balaustreId)
    : null;
  const templateData = data || balaustre.dadosFormulario;

  const logoBase64 = imageToBase64("assets/images/logoJPJ_.png");

  const buildSignatureBlock = (signatureInfo, role) => {
    if (signatureInfo) {
      return `
        <div class="signature-seal">
          <div class="seal-content">
            <div class="seal-logo"><img src="${logoBase64}" alt="Logo"></div>
            <div class="seal-text">
              <div class="signer-name">${signatureInfo.nome}</div>
              <div class="signer-role">${role}</div>
              <div class="signer-timestamp">${signatureInfo.timestamp}</div>
            </div>
          </div>
        </div>`;
    } else {
      return `
        <p class="mso-sign-li" align="center" style="line-height: 0.2">
          <span style="font-size: 10pt">___________________________</span>
        </p>
        <p class="mso-sign" align="center" style="line-height: normal">
          <span style="font-size: 10pt">${role}</span>
        </p>`;
    }
  };

  const assinaturas = balaustre ? balaustre.assinaturas : {};
  templateData.secretario_signature_block = buildSignatureBlock(
    assinaturas.secretario,
    "Secretário"
  );
  templateData.orador_signature_block = buildSignatureBlock(
    assinaturas.orador,
    "Orador"
  );
  templateData.veneravel_mestre_signature_block = buildSignatureBlock(
    assinaturas.veneravel_mestre,
    "Venerável Mestre"
  );

  const processedData = prepareDataForBalaustre(templateData);
  const pdfResult = await generateBalaustrePdf(processedData);

  if (balaustre) {
    await balaustre.update({ caminhoPdfLocal: pdfResult.pdfPath });
  }

  return pdfResult;
}

export async function createEditalFromTemplate(
  editalData,
  signerName,
  sessionNumber
) {
  editalData.numero_balaustre = sessionNumber;
  const pdfResult = await regenerateEditalPdf(editalData, signerName);

  return pdfResult;
}

export async function regenerateEditalPdf(editalData, signerName) {
  const templateData = editalData;

  const logoBase64 = imageToBase64("assets/images/logoJPJ_.png");

  const buildSignatureBlock = (name, role, creationDate) => {
    if (name) {
      return `
        <div class="signature-seal" style="margin: 0 auto; text-align: center;">
          <div class="seal-content">
            <div class="seal-logo"><img src="${logoBase64}" alt="Logo" style="display: block; margin: 0 auto;"></div>
            <div class="seal-text">
              <p style="margin-bottom: 2px;">Assinado eletrônicamente por:</p>
              <p style="margin-bottom: 2px;">${name}</p>
              <p style="margin-bottom: 2px;">${role}</p>
              <p style="margin-top: 2px;">na data de ${creationDate}</p>
            </div>
          </div>
        </div>`;
    } else {
      return `
        <p class="mso-sign-li" align="center" style="line-height: 0.2">
          <span style="font-size: 10pt">___________________________</span>
        </p>
        <p class="mso-sign" align="center" style="line-height: normal">
          <span style="font-size: 10pt">${role}</span>
        </p>`;
    }
  };

  const editalCreationDate = new Date().toLocaleDateString("pt-BR"); // Get current date for edital creation
  templateData.chanceler_signature_block = buildSignatureBlock(
    signerName,
    "Chanceler",
    editalCreationDate
  );
  templateData.veneravel_mestre_signature_block = buildSignatureBlock(
    null,
    "Venerável Mestre",
    editalCreationDate
  ); // Assuming Venerável Mestre does not sign automatically

  const pdfResult = await generateEditalPdf(templateData);

  return pdfResult;
}

export async function createCartaoAniversarioFromTemplate(aniversarianteData) {
  // A lógica para buscar dados do BD foi movida para o controller/serviço que chama esta função.
  // Esta função agora foca apenas na geração do PDF com os dados recebidos.
  return generateCartaoPdf(aniversarianteData);
}

export async function createConviteFromTemplate(conviteData) {
  const pdfResult = await generateConvitePdf(conviteData);
  return pdfResult;
}

const prepareDataForConvite = (d) => {
  const processed = { ...d };
  if (d.classe_sessao) {
    processed.classe_sessao = String(d.classe_sessao); // Sem transformação para uppercase
  }
  if (d.veneravel) {
    processed.veneravel = String(d.veneravel); // Sem transformação para uppercase
  }
  if (d.dia_sessao) {
    processed.dia_sessao = String(d.dia_sessao); // Sem transformação para uppercase
  }
  if (d.hora_sessao) {
    processed.hora_sessao = String(d.hora_sessao); // Sem transformação para uppercase
  }
  // Log para depuração, para verificar se os dados estão sendo transformados
  console.log("[DEBUG] Dados processados para convite:", processed);
  return processed;
};

const prepareDataForBalaustre = (d) => {
  const processed = { ...d };
  const allTemplateFields = [
    "numero_balaustre",
    "classe_sessao_titulo",
    "hora_inicio_sessao",
    "dia_sessao",
    "classe_sessao_corpo",
    "numero_irmaos_quadro",
    "numero_visitantes",
    "veneravel",
    "primeiro_vigilante",
    "segundo_vigilante",
    "orador",
    "secretario",
    "tesoureiro",
    "chanceler",
    "balaustre_anterior",
    "expediente_recebido",
    "expediente_expedido",
    "saco_proposta",
    "ordem_dia",
    "escrutinio",
    "tempo_instrucao",
    "tronco_beneficencia",
    "palavra",
    "hora_encerramento",
    "data_assinatura",
    "emendas",
  ];
  allTemplateFields.forEach((field) => {
    if (!(field in processed)) {
      processed[field] = "";
    }
  });
  const uppercaseFields = [
    "veneravel",
    "primeiro_vigilante",
    "segundo_vigilante",
    "orador",
    "secretario",
    "tesoureiro",
    "chanceler",
  ];
  uppercaseFields.forEach((field) => {
    if (processed[field]) {
      processed[field] = String(processed[field]).toUpperCase();
    }
  });
  if (d.classe_sessao) {
    processed.classe_sessao_titulo = String(d.classe_sessao).toUpperCase();
    processed.classe_sessao_corpo = String(d.classe_sessao).toLowerCase();
    delete processed.classe_sessao;
  } else {
    if (d.classe_sessao_titulo) {
      processed.classe_sessao_titulo = String(
        d.classe_sessao_titulo
      ).toUpperCase();
    }
    if (d.classe_sessao_corpo) {
      processed.classe_sessao_corpo = String(
        d.classe_sessao_corpo
      ).toLowerCase();
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
