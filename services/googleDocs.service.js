import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentialsPath = path.join(__dirname, "..", "google-credentials.json");
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
  ],
});

// --- FUNÇÃO AUXILIAR PARA PREPARAR OS DADOS ---
// Centraliza toda a formatação dos dados antes de enviar para o Google.
const prepareDataForGoogle = (data) => {
  const processedData = { ...data };

  // Lista de campos de oficiais para converter para maiúsculas
  const uppercaseFields = [
    "NumeroBalaustre",
    "Veneravel",
    "PrimeiroVigilante",
    "SegundoVigilante",
    "Orador",
    "Secretario",
    "Tesoureiro",
    "Chanceler",
  ];

  // Converte os campos de oficiais para maiúsculas
  uppercaseFields.forEach((field) => {
    if (processedData[field]) {
      processedData[field] = String(processedData[field]).toUpperCase();
    }
  });

  // Cria os placeholders para o título e corpo a partir do campo único ClasseSessao
  if (processedData.ClasseSessao) {
    processedData.ClasseSessao_Titulo = String(
      processedData.ClasseSessao
    ).toUpperCase();
    processedData.ClasseSessao_Corpo = String(
      processedData.ClasseSessao
    ).toLowerCase();
    // Remove a chave original para evitar substituições indesejadas
    delete processedData.ClasseSessao;
  }

  return processedData;
};

// Função para CRIAR um novo balaústre a partir do modelo
export async function createBalaustreFromTemplate(data) {
  const drive = google.drive({ version: "v3", auth });
  const docs = google.docs({ version: "v1", auth });

  const TEMPLATE_ID = process.env.GOOGLE_DOCS_BALAUSTRE_TEMPLATE_ID;
  const FOLDER_ID = process.env.GOOGLE_DRIVE_DESTINATION_FOLDER_ID;

  // Usa a função auxiliar para processar os dados
  const processedData = prepareDataForGoogle(data);

  const copyResponse = await drive.files.copy({
    fileId: TEMPLATE_ID,
    requestBody: {
      // Usa a versão em maiúsculas para o nome do arquivo
      name: `Balaústre N° ${data.NumeroBalaustre} - ${processedData.ClasseSessao_Titulo} de ${data.DiaSessao}`,
      parents: [FOLDER_ID],
    },
  });
  const newDocumentId = copyResponse.data.id;

  const requests = Object.entries(processedData).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{{${key}}}`, matchCase: false },
      replaceText: String(value || ""),
    },
  }));

  await docs.documents.batchUpdate({
    documentId: newDocumentId,
    requestBody: { requests: requests.reverse() },
  });

  const pdfDir = path.join(__dirname, "..", "uploads", "balaustres");
  const pdfFileName = `Balaustre_${newDocumentId}.pdf`;
  const pdfFilePath = path.join(pdfDir, pdfFileName);
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const pdfResponse = await drive.files.export(
    { fileId: newDocumentId, mimeType: "application/pdf" },
    { responseType: "stream" }
  );
  const dest = fs.createWriteStream(pdfFilePath);
  await new Promise((resolve, reject) => {
    Readable.from(pdfResponse.data)
      .pipe(dest)
      .on("finish", resolve)
      .on("error", reject);
  });

  return {
    googleDocId: newDocumentId,
    pdfPath: `/uploads/balaustres/${pdfFileName}`,
  };
}

// Deleta um arquivo no Google Drive pelo seu ID
export async function deleteGoogleFile(fileId) {
  const drive = google.drive({ version: "v3", auth });
  try {
    await drive.files.delete({ fileId });
    console.log(
      `[GoogleDocsService] Arquivo antigo deletado com sucesso: ${fileId}`
    );
  } catch (error) {
    // Não quebra a aplicação se o arquivo já tiver sido deletado, apenas regista o aviso.
    console.warn(
      `[GoogleDocsService] Aviso ao deletar arquivo ${fileId}: ${error.message}`
    );
  }
}
