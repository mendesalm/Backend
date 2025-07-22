import db from "../models/index.js";
import { createBalaustreFromTemplate, deleteLocalFile, regenerateBalaustrePdf } from "../services/documents.service.js";
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



/**
 * Substitui o PDF de um balaústre em status 'Minuta' por um arquivo enviado.
 */
export const substituirMinuta = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    try {
        const balaustre = await db.Balaustre.findByPk(id);
        if (!balaustre) {
            // Se o balaústre não existe, deletar o arquivo que foi salvo pelo multer
            deleteLocalFile(req.file.path);
            return res.status(404).json({ message: "Balaústre não encontrado." });
        }

        if (balaustre.status !== 'Minuta') {
            deleteLocalFile(req.file.path);
            return res.status(403).json({ message: "Apenas minutas de balaústre podem ser substituídas." });
        }

        // Deletar o PDF antigo
        if (balaustre.caminhoPdfLocal) {
            await deleteLocalFile(balaustre.caminhoPdfLocal);
        }

        // O multer já salvou o novo arquivo. Agora, atualizamos o caminho no banco.
        // O caminho salvo pelo multer é absoluto, precisamos do relativo.
        const relativePath = `/uploads/balaustres/${req.file.filename}`;

        await balaustre.update({
            caminhoPdfLocal: relativePath,
        });

        res.status(200).json({ 
            message: "Minuta do balaústre substituída com sucesso!", 
            balaustre 
        });

    } catch (error) {
        // Em caso de erro, deletar o arquivo que foi salvo pelo multer
        if (req.file) {
            deleteLocalFile(req.file.path);
        }
        console.error("Erro ao substituir a minuta do balaústre:", error);
        res.status(500).json({ message: "Falha ao substituir a minuta.", errorDetails: error.message });
    }
};

/**
 * Aprova um balaústre, adicionando o selo do usuário logado e mudando o status para 'Aprovado'
 * quando todas as assinaturas necessárias estiverem presentes.
 */
export const aprovarBalaustre = async (req, res) => {
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

        if (balaustre.status === 'Aprovado') {
            await t.rollback();
            return res.status(400).json({ message: "Este balaústre já foi aprovado e não pode ser modificado." });
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
            balaustre.status = 'Aprovado';
        }

        await balaustre.save({ transaction: t });

        // A regeneração do PDF agora acontece com as assinaturas (ou selos)
        await regenerateBalaustrePdf(id);

        await t.commit();

        res.status(200).json({ message: "Documento assinado e status atualizado com sucesso!", data: balaustre });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao assinar o balaústre:", error);
        res.status(500).json({ message: "Falha ao assinar o balaústre.", errorDetails: error.message });
    }
};

/**
 * Força a aprovação de um balaústre manualmente (bypass de assinaturas).
 * Acessível apenas por Secretário ou Webmaster.
 */
export const aprovarManualmenteBalaustre = async (req, res) => {
    const { id } = req.params;

    const t = await db.sequelize.transaction();
    try {
        const balaustre = await db.Balaustre.findByPk(id, { transaction: t });
        if (!balaustre) {
            await t.rollback();
            return res.status(404).json({ message: "Balaústre não encontrado." });
        }

        if (balaustre.status === 'Aprovado') {
            await t.rollback();
            return res.status(400).json({ message: "Este balaústre já foi aprovado." });
        }

        const { dataAprovacao } = req.body; // Nova linha para capturar a data de aprovação

        if (!dataAprovacao) {
            await t.rollback();
            return res.status(400).json({ message: "A data de aprovação é obrigatória para a aprovação manual." });
        }

        const dataAprovacaoFormatada = format(new Date(dataAprovacao), "dd/MM/yyyy", { locale: ptBR });

        const userCargos = await db.CargoExercido.findAll({
            where: { lodgeMemberId: req.user.id, dataTermino: null },
            transaction: t
        });

        let cargoAtestacao = null;
        const cargosPermitidos = [
            'Venerável Mestre', 'Secretário', 'Secretário Adjunto', 'Orador', 'Orador Adjunto'
        ];

        // Prioriza a ordem dos cargos para a atestação
        for (const cargo of cargosPermitidos) {
            if (userCargos.some(uc => uc.nomeCargo === cargo)) {
                cargoAtestacao = cargo;
                break;
            }
        }

        if (!cargoAtestacao) {
            await t.rollback();
            return res.status(403).json({ message: "Usuário não possui cargo permitido para atestar manualmente." });
        }

        const assinaturasAtuais = balaustre.assinaturas || {};
        assinaturasAtuais.atestacaoManual = {
            nome: req.user.NomeCompleto,
            cargo: cargoAtestacao,
            timestamp: format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }),
            dataAprovacao: dataAprovacaoFormatada, // Usar a data de aprovação fornecida
            textoAtestacao: `Atesto que o presente documento é cópia fiel do original assinado pelas Autoridades supracitadas na Sessão de ${dataAprovacaoFormatada}.`
        };

        balaustre.assinaturas = assinaturasAtuais;
        balaustre.status = 'Aprovado';
        await balaustre.save({ transaction: t });

        // Regenera o PDF para refletir o estado final com o selo de atestação
        await regenerateBalaustrePdf(id);

        await t.commit();

        res.status(200).json({ message: "Balaústre aprovado manualmente com sucesso!", data: balaustre });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao aprovar o balaústre manualmente:", error);
        res.status(500).json({ message: "Falha ao aprovar o balaústre manualmente.", errorDetails: error.message });
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

        if (balaustre.status === 'Aprovado') {
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