import db from "../models/index.js";
import { readFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { Op, fn } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para converter imagem em base64
const imageToBase64 = (imgPath) => {
  const absolutePath = path.resolve(__dirname, "..", imgPath);
  if (!existsSync(absolutePath)) {
    console.warn(`Imagem não encontrada: ${absolutePath}`);
    // Retorna um GIF de 1x1 pixel transparente como placeholder para imagens ausentes
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  const imageData = readFileSync(absolutePath);
  // Determina o tipo de conteúdo com base na extensão do arquivo
  let contentType = "application/octet-stream";
  if (imgPath.endsWith(".png")) contentType = "image/png";
  else if (imgPath.endsWith(".jpg") || imgPath.endsWith(".jpeg"))
    contentType = "image/jpeg";
  else if (imgPath.endsWith(".gif")) contentType = "image/gif";
  else if (imgPath.endsWith(".svg")) contentType = "image/svg+xml";
  else if (imgPath.endsWith(".webp")) contentType = "image/webp";
  else if (imgPath.endsWith(".bmp")) contentType = "image/bmp";

  return `data:${contentType};base64,${imageData.toString("base64")}`;
};

/**
 * Função genérica para gerar um PDF a partir de um template HTML usando Puppeteer.
 * @param {string} templateName - Nome do arquivo do template HTML (ex: 'balaustre').
 * @param {object} data - Dados para preencher o template.
 * @param {string} newDocTitle - Título para o novo documento (usado para o nome do arquivo).
 * @param {string} pdfSubfolder - Subpasta dentro de 'uploads' para salvar o PDF.
 * @returns {Promise<object>} Objeto com pdfPath.
 */
async function createPdfFromTemplate(
  templateName,
  data,
  newDocTitle,
  pdfSubfolder,
  pdfOptions = {}
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "pdf",
    `${templateName}.html`
  );
  let htmlContent = readFileSync(templatePath, "utf8");

  // Read font files and convert to Base64
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

  // Inject @font-face rules with Base64 encoded fonts into the HTML
  const fontStyles = `
    @font-face {
      font-family: "Poppins";
      src: url("data:font/truetype;charset=utf-8;base64,${poppinsRegularBase64}") format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "Poppins";
      src: url("data:font/truetype;charset=utf-8;base64,${poppinsBoldBase64}") format("truetype");
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: "Open Sans";
      src: url("data:font/truetype;charset=utf-8;base64,${openSansRegularBase64}") format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "Open Sans";
      src: url("data:font/truetype;charset=utf-8;base64,${openSansBoldBase64}") format("truetype");
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: "Oleo Script";
      src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptRegularBase64}") format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "Oleo Script";
      src: url("data:font/truetype;charset=utf-8;base64,${oleoScriptBoldBase64}") format("truetype");
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: "Great Vibes";
      src: url("data:font/truetype;charset=utf-8;base64,${greatVibesRegularBase64}") format("truetype");
      font-weight: normal;
      font-style: normal;
    }
  `;

  // Find the closing </style> tag and insert the new font styles before it
  htmlContent = htmlContent.replace("</style>", `${fontStyles}</style>`);

  // Injeta imagens base64 no objeto de dados para substituição no template
  // Assumindo que os templates usam {{headerImage}} e {{footerImage}}
  data.headerImage = imageToBase64("assets/images/logoJPJ_.png");
  data.footerImage = imageToBase64("assets/images/logoRB_.png");
  data.backgroundImage = imageToBase64("assets/images/cartao_fundo.svg");

  // Substitui os placeholders no HTML
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    htmlContent = htmlContent.replace(regex, String(value ?? ""));
  });

  const pdfDir = path.join(process.cwd(), "uploads", pdfSubfolder);
  if (!existsSync(pdfDir)) {
    mkdirSync(pdfDir, { recursive: true });
  }

  const sanitizedTitle = newDocTitle
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Allow alphanumeric, spaces, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .toLowerCase();
  const pdfFileName = `${sanitizedTitle}_${Date.now()}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const defaultPdfOptions = {
    format: "A4",
    landscape: false,
    printBackground: true,
    margin: {
      top: "1cm",
      right: "1.5cm",
      bottom: "1cm",
      left: "1.5cm",
    },
    displayHeaderFooter: false, // Default to false, enable per-template
  };

  const finalPdfOptions = { ...defaultPdfOptions, ...pdfOptions };

  await page.pdf({
    path: pdfFilePath,
    ...finalPdfOptions,
  });

  await browser.close();

  const relativePath = path
    .join("uploads", pdfSubfolder, pdfFileName)
    .replace(/\\/g, "/");

  console.log(`[PDFService] PDF salvo em: ${pdfFilePath}`);
  console.log(`[PDFService] Caminho relativo para frontend: /${relativePath}`);

  return {
    pdfPath: `/${relativePath}`,
  };
}

// --- Funções Públicas Exportadas (adaptadas para usar createPdfFromTemplate) ---

export async function createBalaustreFromTemplate(data, masonicSessionId) {
  // 1. Obter e incrementar o número do balaústre
  let currentBalaustreNumber = 1; // Valor padrão
  const config = await db.Configuracao.findByPk("nextBalaustreNumber");
  if (config && config.valor) {
    currentBalaustreNumber = parseInt(config.valor);
  }

  // Atribuir o número ao objeto de dados
  data.NumeroBalaustre = currentBalaustreNumber;

  // Incrementar e salvar o próximo número
  await db.Configuracao.upsert({
    chave: "nextBalaustreNumber",
    valor: String(currentBalaustreNumber + 1),
  });

  // Mapeamento de cargos para os placeholders do template
  const cargoPlaceholderMapping = {
    "Venerável Mestre": "Veneravel",
    "Primeiro Vigilante": "PrimeiroVigilante",
    "Segundo Vigilante": "SegundoVigilante",
    Orador: "Orador",
    Secretário: "Secretario",
    Tesoureiro: "Tesoureiro",
    Chanceler: "Chanceler",
  };

  // Busca os nomes dos oficiais da sessão se o masonicSessionId for fornecido
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
      if (attendee.membro && attendee.membro.cargos) {
        attendee.membro.cargos.forEach((cargo) => {
          const placeholder = cargoPlaceholderMapping[cargo.nomeCargo];
          if (placeholder && !data[placeholder]) {
            // Preenche apenas se não foi enviado pelo frontend
            data[placeholder] = attendee.membro.NomeCompleto;
          }
        });
      }
    });
  }

  const prepareDataForBalaustre = (d) => {
    const processed = { ...d };

    // Garante que todos os campos do template existam para a substituição.
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
        processed.ClasseSessao_Corpo = String(
          d.ClasseSessao_Corpo
        ).toLowerCase();
      }
    }
    return processed;
  };

  const processedData = prepareDataForBalaustre(data);
  const title = `Balaústre N° ${data.NumeroBalaustre} - ${processedData.ClasseSessao_Titulo} de ${data.DiaSessao}`;
  const pdfOptions = {
    format: "A4", // Formato original do balaústre
    landscape: false,
    displayHeaderFooter: true,
    footerTemplate: `<div style="
        position: absolute;
        top: 1cm;
        left: 1.5cm;
        right: 1.5cm;
        bottom: 1cm;
        border: 1pt solid #800;
        pointer-events: none;
    "></div>
    <div style="
        position: absolute;
        bottom: 0.5cm;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
    ">
        <div style="
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 8mm;
            height: 8mm;
            border-radius: 50%;
            border: 1px solid #800;
            background-color: #f0f0f0;
            color: #333;
        ">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
    </div>`,
    headerTemplate: "<div></div>",
  };


  return createPdfFromTemplate(
    "balaustre",
    processedData,
    title,
    "balaustres",
    pdfOptions
  );
}

export const createEditalFromTemplate = async (editalData) => {
  const title = `Edital de Convocação - Sessão de ${editalData.dia_semana} ${editalData.data_sessao_extenso}`;
  const pdfOptions = {
    format: "A4",
    landscape: false,
  };

  return createPdfFromTemplate(
    "edital",
    editalData,
    title,
    "editais",
    pdfOptions
  );
};

export const createCartaoAniversarioFromTemplate = async (
  db,
  aniversarianteData,
  subtipoMensagem
) => {
  // 1. Buscar Venerável Mestre atual
  const hoje = new Date();
  const veneravelMestreCargo = await db.CargoExercido.findOne({
    where: {
      nomeCargo: 'Venerável Mestre',
      dataInicio: { [Op.lte]: hoje },
      [Op.or]: [
        { dataTermino: { [Op.gte]: hoje } },
        { dataTermino: null }
      ]
    },
    include: [{ model: db.LodgeMember, as: 'membro', attributes: ['NomeCompleto'] }]
  });
  const nomeVeneravel = veneravelMestreCargo ? veneravelMestreCargo.membro.NomeCompleto : 'Venerável Mestre não encontrado';

  // 2. Buscar mensagem aleatória
  const mensagemAleatoria = await db.CorpoMensagem.findOne({
    where: { tipo: 'ANIVERSARIO', subtipo: subtipoMensagem, ativo: true },
    order: db.sequelize.random() // Ou fn('RAND') para MySQL
  });
  if (!mensagemAleatoria) {
    throw new Error(`Nenhuma mensagem de aniversário ativa encontrada para o subtipo '${subtipoMensagem}'.`);
  }

  // 3. Injetar a mensagem e o nome do Venerável Mestre nos dados
  const finalData = {
    ...aniversarianteData,
    MENSAGEM_DINAMICA: mensagemAleatoria.conteudo,
    VENERAVEL: nomeVeneravel,
  };

  const title = `Cartão de Aniversário - ${aniversarianteData.NOME_ANIVERSARIANTE}`;
  const pdfOptions = {
    format: "A5",
    landscape: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  };

  return createPdfFromTemplate(
    "cartao_aniversario", // Nome do template HTML
    finalData,
    title,
    "cartoes_aniversario",
    pdfOptions
  );
};

// Função para deletar arquivos locais (usada para limpeza)
export async function deleteLocalFile(filePath) {
  if (!filePath) return;
  try {
    // O caminho do arquivo pode vir com uma '/' inicial, precisamos remover
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
