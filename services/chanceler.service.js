// services/chanceler.service.js
import db from "../models/index.js";
// Importa a nova função específica que acabámos de criar
import { createCartaoAniversarioFromTemplate } from "./googleDocs.service.js";

// ... (outras funções do seu serviço do chanceler)

/**
 * Prepara os dados e chama o serviço do Google Docs para gerar o PDF do cartão.
 * @param {object} aniversariante - Objeto contendo { nome, dataNascimento }
 * @returns {Promise<string>} O caminho relativo para o PDF gerado.
 */
export const gerarCartaoAniversarioPDF = async (aniversariante) => {
  try {
    // 1. Preparar os dados para o template
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

    // 2. Chamar a função centralizada no googleDocs.service
    const resultado = await createCartaoAniversarioFromTemplate(placeholders);
    if (!resultado || !resultado.pdfPath) {
      throw new Error(
        "Falha ao obter o caminho do PDF gerado pelo googleDocs.service."
      );
    }

    // 3. Deleta o ficheiro no Google Drive após gerar o PDF (opcional, mas recomendado)
    // await deleteGoogleFile(resultado.googleDocId);

    // 4. Retorna apenas o caminho relativo do PDF, como esperado pelo resto da aplicação
    return resultado.pdfPath;
  } catch (error) {
    console.error(
      "Erro no serviço do Chanceler ao gerar cartão de aniversário:",
      error
    );
    throw error;
  }
};
