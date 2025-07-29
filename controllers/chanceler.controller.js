// backend/controllers/chanceler.controller.js
import db from "../models/index.js";
// Importa as funções corretas do serviço
import { getChancelerPanelData } from "../services/chanceler.service.js";
import { createCartaoAniversarioFromTemplate } from "../services/documents.service.js";

/**
 * Controller para buscar os dados para o Painel do Chanceler.
 * É chamado pela rota GET /api/chanceler/panel
 */
export const getPanelData = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    if (!dataInicio || !dataFim) {
      return res
        .status(400)
        .json({
          message: "Os parâmetros dataInicio e dataFim são obrigatórios.",
        });
    }

    // Chama a função correta do serviço
    const dados = await getChancelerPanelData(
      new Date(dataInicio),
      new Date(dataFim)
    );
    res.status(200).json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados para o Painel do Chanceler:", error);
    res
      .status(500)
      .json({
        message: "Erro interno ao processar a solicitação.",
        errorDetails: error.message,
      });
  }
};

/**
 * Controller para gerar um cartão de aniversário manualmente.
 * É chamado pela rota POST /api/chanceler/gerar-cartao
 */
export const getChanceryReportsPage = async (req, res) => {
  try {
    res.status(200).json({ message: "Página de relatórios da Chancelaria acessada com sucesso." });
  } catch (error) {
    console.error("Erro ao acessar página de relatórios da Chancelaria:", error);
    res.status(500).json({ message: "Erro interno ao processar a solicitação.", errorDetails: error.message });
  }
};

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export const gerarCartaoManual = async (req, res) => {
  const { memberId, familyMemberId } = req.body;
  try {
    let aniversarianteData = {};
    let dataNascimento;
    let nomeCompleto;
    let parentesco;
    let subtipoMensagem;

    if (memberId) {
      const membro = await db.LodgeMember.findByPk(memberId, {
        attributes: ["NomeCompleto", "DataNascimento", "Situacao"],
      });
      if (!membro)
        return res.status(404).json({ message: "Membro não encontrado." });
      if (membro.Situacao !== "Ativo")
        return res
          .status(400)
          .json({
            message: `Não é possível gerar cartão para um membro com situação "${membro.Situacao}".`,
          });
      nomeCompleto = membro.NomeCompleto;
      dataNascimento = membro.DataNascimento;
      aniversarianteData.vocativo = "Querido Irmão";
      subtipoMensagem = "IRMAO";
    } else if (familyMemberId) {
      const familiar = await db.FamilyMember.findByPk(familyMemberId, {
        attributes: ["nomeCompleto", "dataNascimento", "falecido", "parentesco"],
      });
      if (!familiar)
        return res.status(404).json({ message: "Familiar não encontrado." });
      if (familiar.falecido)
        return res
          .status(400)
          .json({
            message: "Não é possível gerar cartão para um familiar falecido.",
          });
      nomeCompleto = familiar.nomeCompleto;
      dataNascimento = familiar.dataNascimento;
      parentesco = familiar.parentesco;

      switch (parentesco) {
        case "Cônjuge":
          aniversarianteData.vocativo = "Querida Cunhada";
          subtipoMensagem = "CUNHADA";
          break;
        case "Filho":
          aniversarianteData.vocativo = "Querido Sobrinho";
          subtipoMensagem = "SOBRINHO";
          break;
        case "Filha":
          aniversarianteData.vocativo = "Querida Sobrinha";
          subtipoMensagem = "SOBRINHO";
          break;
        default:
          aniversarianteData.vocativo = "Prezado(a)"; // Fallback
          subtipoMensagem = "FAMILIAR"; // Fallback para subtipo
      }
    } else {
      return res
        .status(400)
        .json({
          message: "É necessário fornecer o ID do membro ou do familiar.",
        });
    }

    // Formatar a data de nascimento para o template
    
    const corpoMensagem = await db.CorpoMensagem.findOne({
      where: { tipo: 'ANIVERSARIO', subtipo: subtipoMensagem, ativo: true },
      order: [db.sequelize.random()],
    });

    const veneravel = await db.LodgeMember.findOne({
      include: [{
        model: db.CargoExercido,
        as: 'cargos',
        where: { nomeCargo: 'Venerável Mestre', dataTermino: null },
      }],
    });

    aniversarianteData.nome_aniversariante = nomeCompleto;
    aniversarianteData.data_aniversario = format(dataNascimento, "dd 'de' MMMM", { locale: ptBR });
    aniversarianteData.ano_atual = format(new Date(), "yyyy");
    aniversarianteData.mensagem_dinamica = corpoMensagem ? corpoMensagem.conteudo : 'Feliz Aniversário!';
    aniversarianteData.veneravel = veneravel ? veneravel.NomeCompleto : 'Venerável Mestre';

    const { pdfPath } = await createCartaoAniversarioFromTemplate(aniversarianteData);
    res
      .status(200)
      .json({ message: "Cartão gerado com sucesso!", caminho: pdfPath });
  } catch (error) {
    console.error("Erro ao gerar cartão manual:", error);
    res
      .status(500)
      .json({
        message: "Erro ao gerar cartão manual.",
        errorDetails: error.message,
      });
  }
};
