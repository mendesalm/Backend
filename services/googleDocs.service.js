import { google } from "googleapis";
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

export async function createBalaustreFromTemplate(data) {
  const TEMPLATE_ID = process.env.GOOGLE_DOCS_BALAUSTRE_TEMPLATE_ID;
  if (!TEMPLATE_ID)
    throw new Error("ID do template de Balaústre não definido no .env");

  const prepareDataForBalaustre = (d) => {
    const processed = { ...d };
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
      if (processed[field])
        processed[field] = String(processed[field]).toUpperCase();
    });
    if (processed.ClasseSessao) {
      processed.ClasseSessao_Titulo = String(
        processed.ClasseSessao
      ).toUpperCase();
      processed.ClasseSessao_Corpo = String(
        processed.ClasseSessao
      ).toLowerCase();
      delete processed.ClasseSessao;
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
