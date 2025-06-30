import { google } from "googleapis";
import db from "../models/index.js";
// --- CORREÇÃO APLICADA AQUI ---
// Importamos todas as funções necessárias do módulo 'fs' de uma só vez.
import { readFileSync, createWriteStream, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Função interna e única para autenticação com o Google.
 */
const googleAuth = () => {
  const credentialsPath = path.join(__dirname, "..", "google-credentials.json");
  const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
};

const auth = googleAuth(); // A instância é criada uma vez e reutilizada

/**
 * Função genérica e central para criar qualquer documento a partir de um template.
 */
async function createDocFromTemplate(
  templateId,
  data,
  newDocTitle,
  pdfSubfolder
) {
  const drive = google.drive({ version: "v3", auth });
  const docs = google.docs({ version: "v1", auth });
  const FOLDER_ID = process.env.GOOGLE_DRIVE_DESTINATION_FOLDER_ID;

  // 1. Copia o template
  const copyResponse = await drive.files.copy({
    fileId: templateId,
    requestBody: { name: newDocTitle, parents: [FOLDER_ID] },
  });
  const newDocumentId = copyResponse.data.id;

  // 2. Prepara e aplica as substituições de texto
  const requests = Object.entries(data).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{{${key}}}`, matchCase: false },
      replaceText: String(value ?? ""),
    },
  }));

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: newDocumentId,
      requestBody: { requests: requests.reverse() },
    });
  }

  // 3. Exporta como PDF e salva localmente
  const pdfResponse = await drive.files.export(
    { fileId: newDocumentId, mimeType: "application/pdf" },
    { responseType: "stream" }
  );

  const pdfDir = path.join(process.cwd(), "uploads", pdfSubfolder);
  if (!existsSync(pdfDir)) {
    mkdirSync(pdfDir, { recursive: true });
  }

  const sanitizedTitle = newDocTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const pdfFileName = `${sanitizedTitle}_${newDocumentId.substring(0, 8)}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);

  // --- CORREÇÃO APLICADA AQUI ---
  // A função createWriteStream agora está corretamente importada e disponível
  const dest = createWriteStream(pdfFilePath);
  await new Promise((resolve, reject) => {
    Readable.from(pdfResponse.data)
      .pipe(dest)
      .on("finish", resolve)
      .on("error", reject);
  });

  // 4. Retorna os IDs e o caminho relativo padronizado para a URL
  const relativePath = path
    .join("uploads", pdfSubfolder, pdfFileName)
    .replace(/\\/g, "/");

  return {
    googleDocId: newDocumentId,
    pdfPath: `/${relativePath}`,
  };
}

// --- Funções Públicas Exportadas (sem alterações na lógica interna) ---

export async function createBalaustreFromTemplate(data, masonicSessionId) {
  const TEMPLATE_ID = process.env.GOOGLE_DOCS_BALAUSTRE_TEMPLATE_ID;
  if (!TEMPLATE_ID) {
    throw new Error("ID do template de Balaústre não definido no .env");
  }

  // 1. Obter e incrementar o número do balaústre
  let currentBalaustreNumber = 1; // Valor padrão
  const config = await db.Configuracao.findByPk('nextBalaustreNumber');
  if (config && config.valor) {
    currentBalaustreNumber = parseInt(config.valor);
  }

  // Atribuir o número ao objeto de dados
  data.NumeroBalaustre = currentBalaustreNumber;

  // Incrementar e salvar o próximo número
  await db.Configuracao.upsert({
    chave: 'nextBalaustreNumber',
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
              where: {
                dataTermino: null, // Apenas cargos ativos
              },
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
      "NumeroBalaustre", "ClasseSessao_Titulo", "HoraInicioSessao", "DiaSessao",
      "ClasseSessao_Corpo", "NumeroIrmaosQuadro", "NumeroVisitantes", "Veneravel",
      "PrimeiroVigilante", "SegundoVigilante", "Orador", "Secretario", "Tesoureiro",
      "Chanceler", "DataSessaoAnterior", "EmendasBalaustreAnterior", "ExpedienteRecebido",
      "ExpedienteExpedido", "SacoProposta", "OrdemDia", "Escrutinio", "TempoInstrucao",
      "TroncoBeneficiencia", "Palavra", "HoraEncerramento", "DataAssinatura", "Emendas"
    ];
    allTemplateFields.forEach(field => {
      if (!(field in processed)) {
        processed[field] = "";
      }
    });

    const uppercaseFields = [
      "Veneravel", "PrimeiroVigilante", "SegundoVigilante", "Orador",
      "Secretario", "Tesoureiro", "Chanceler",
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
        processed.ClasseSessao_Titulo = String(d.ClasseSessao_Titulo).toUpperCase();
      }
      if (d.ClasseSessao_Corpo) {
        processed.ClasseSessao_Corpo = String(d.ClasseSessao_Co
rpo).toLowerCase();
      }
    }
    return processed;
  };

  const processedData = prepareDataForBalaustre(data);
  const title = `Balaústre N° ${data.NumeroBalaustre} - ${processedData.ClasseSessao_Titulo} de ${data.DiaSessao}`;

  return createDocFromTemplate(TEMPLATE_ID, processedData, title, "balaustres");
}

export const createEditalFromTemplate = async (editalData) => {
  const TEMPLATE_ID = process.env.GOOGLE_DOCS_EDITAL_TEMPLATE_ID;
  if (!TEMPLATE_ID)
    throw new Error("ID do template de Edital não definido no .env");

  const title = `Edital de Convocação - Sessão de ${editalData.dia_semana} ${editalData.data_sessao_extenso}`;

  return createDocFromTemplate(TEMPLATE_ID, editalData, title, "editais");
};

export async function deleteGoogleFile(fileId) {
  if (!fileId) return;
  try {
    const drive = google.drive({ version: "v3", auth });
    await drive.files.delete({ fileId });
    console.log(
      `[GoogleDocsService] Arquivo antigo deletado com sucesso: ${fileId}`
    );
  } catch (error) {
    console.warn(
      `[GoogleDocsService] Aviso ao deletar arquivo ${fileId}: ${error.message}`
    );
  }
}
/**
 * Cria um Cartão de Aniversário a partir de um template.
 * @param {object} aniversarianteData - Dados para preencher no template (ex: { NOME_ANIVERSARIANTE, DATA_ANIVERSARIO }).
 * @returns {Promise<object>} Objeto com o ID do Google Doc e o caminho relativo do PDF.
 */
export const createCartaoAniversarioFromTemplate = async (
  aniversarianteData
) => {
  const TEMPLATE_ID = process.env.GOOGLE_DOCS_CARTAO_ANIVERSARIO_TEMPLATE_ID;
  if (!TEMPLATE_ID) {
    throw new Error(
      "ID do template de Cartão de Aniversário não definido no .env"
    );
  }

  const title = `Cartão de Aniversário - ${aniversarianteData.NOME_ANIVERSARIANTE}`;
  const pdfSubfolder = "cartoes_aniversario"; // Pasta onde os PDFs serão salvos

  // Reutiliza a sua função genérica e robusta
  return createDocFromTemplate(
    TEMPLATE_ID,
    aniversarianteData,
    title,
    pdfSubfolder
  );
};
