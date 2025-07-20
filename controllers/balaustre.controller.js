import db from "../models/index.js";
import { createBalaustreFromTemplate, deleteLocalFile } from "../services/documents.service.js";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

export const getBalaustreDetails = async (req, res) => {
  try {
    const balaustre = await db.Balaustre.findByPk(req.params.id);
    if (!balaustre) {
      return res.status(404).json({ message: "Balaústre não encontrado." });
    }

    const presentesCount = await db.SessionAttendee.count({
      where: { sessionId: balaustre.MasonicSessionId },
    });
    const visitantesCount = await db.VisitanteSessao.count({
      where: { masonicSessionId: balaustre.MasonicSessionId },
    });

    res.status(200).json({
      dadosFormulario: balaustre.dadosFormulario,
      presentesCount,
      visitantesCount,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do balaústre:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao buscar detalhes do balaústre.",
      });
  }
};

import { regenerateBalaustrePdf } from "../services/documents.service.js";

/**
 * Assina um balaústre, adicionando o selo do usuário logado.
 */
export const assinarBalaustre = async (req, res) => {
    const { id } = req.params;
    const { cargo } = req.body; // Cargo que o usuário está assinando como (ex: "Secretário")
    const userId = req.user.id;
    

    if (!cargo) {
        return res.status(400).json({ message: "O cargo do assinante é obrigatório." });
    }

    const t = await db.sequelize.transaction();
    try {
        const balaustre = await db.Balaustre.findByPk(id, { transaction: t });
        if (!balaustre) {
            await t.rollback();
            return res.status(404).json({ message: "Balaústre não encontrado." });
        }

        const assinaturasAtuais = balaustre.assinaturas || {};
        const cargoKey = cargo.toLowerCase().replace(/\s/g, '');

        assinaturasAtuais[cargoKey] = {
                nome: req.user.NomeCompleto,
                timestamp: format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }),
                lodgeMemberId: userId
            };
        
        const cargosNecessarios = ['secretario', 'orador', 'veneravelmestre'];
        const todasAssinadas = cargosNecessarios.every(c => assinaturasAtuais[c]);

        balaustre.assinaturas = assinaturasAtuais;
        if (todasAssinadas) {
            balaustre.status = 'Assinado';
        }

        await balaustre.save({ transaction: t });

        await regenerateBalaustrePdf(id);

        await t.commit();
        
        res.status(200).json({ message: "Documento assinado com sucesso!", data: balaustre });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao assinar o balaústre:", error);
        res.status(500).json({ message: "Falha ao assinar o balaústre.", errorDetails: error.message });
    }
};

/**
 * Atualiza um balaústre, com restrição de edição para documentos assinados.
 */
export const updateBalaustre = async (req, res) => {
    const { id } = req.params;
    const newData = req.body;

    try {
        const balaustre = await db.Balaustre.findByPk(id);
        if (!balaustre) {
            return res.status(404).json({ message: "Balaústre não encontrado para atualizar." });
        }

        if (balaustre.status === 'Assinado') {
            const userIsAdmin = req.user.credencialAcesso === 'Webmaster';
            const userCargos = await db.CargoExercido.findAll({ where: { lodgeMemberId: req.user.id, dataTermino: null } });
            const userIsVeneravel = userCargos.some(c => c.nomeCargo === 'Venerável Mestre');

            if (!userIsAdmin && !userIsVeneravel) {
                return res.status(403).json({ message: "Acesso negado. Este documento já foi assinado e só pode ser editado pelo Venerável Mestre ou Webmaster." });
            }
        }

        const oldPdfPath = balaustre.caminhoPdfLocal;
        
        await balaustre.update({
            dadosFormulario: newData,
            numero: newData.NumeroBalaustre,
            ano: new Date(newData.DiaSessao).getFullYear()
        });

        const { pdfPath } = await regenerateBalaustrePdf(id);

        if (oldPdfPath) {
            await deleteLocalFile(oldPdfPath);
        }

        res.status(200).json({ message: "Balaústre atualizado com sucesso!", balaustre });
    } catch (error) {
        console.error("Erro ao atualizar o balaústre:", error);
        res.status(500).json({ message: "Falha ao atualizar o balaústre.", errorDetails: error.message });
    }
};

export const setNextBalaustreNumber = async (req, res) => {
  const { nextNumber } = req.body;

  if (!nextNumber || isNaN(parseInt(nextNumber)) || parseInt(nextNumber) <= 0) {
    return res.status(400).json({ message: "O número de início do balaústre deve ser um número inteiro positivo." });
  }

  try {
    await db.Configuracao.upsert({
      chave: 'nextBalaustreNumber',
      valor: String(parseInt(nextNumber)),
    });

    res.status(200).json({ message: `Próximo número de balaústre definido para ${nextNumber}.` });
  } catch (error) {
    console.error("Erro ao definir o próximo número de balaústre:", error);
    res.status(500).json({ message: "Erro interno do servidor ao definir o número de balaústre." });
  }
};