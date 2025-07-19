import db from "../models/index.js";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

import { regenerateEditalPdf } from "../services/documents.service.js";

/**
 * Assina um edital, adicionando o selo do usuário logado.
 */
export const assinarEdital = async (req, res) => {
    const { id } = req.params;
    const { cargo } = req.body; // Cargo que o usuário está assinando como (ex: "Chanceler")
    const userId = req.user.id;
    const timeZone = 'America/Sao_Paulo';

    if (!cargo) {
        return res.status(400).json({ message: "O cargo do assinante é obrigatório." });
    }

    const t = await db.sequelize.transaction();
    try {
        const sessao = await db.MasonicSession.findByPk(id, { transaction: t });
        if (!sessao) {
            await t.rollback();
            return res.status(404).json({ message: "Sessão não encontrada." });
        }

        const assinaturasAtuais = sessao.assinaturasEdital || {};
        const cargoKey = cargo.toLowerCase().replace(/\s/g, '');

        assinaturasAtuais[cargoKey] = {
            nome: req.user.NomeCompleto,
            timestamp: formatInTimeZone(new Date(), timeZone, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }),
            lodgeMemberId: userId
        };
        
        const cargosNecessarios = ['chanceler', 'veneravelmestre'];
        const todasAssinadas = cargosNecessarios.every(c => assinaturasAtuais[c]);

        sessao.assinaturasEdital = assinaturasAtuais;
        if (todasAssinadas) {
            sessao.statusEdital = 'Assinado';
        }

        await sessao.save({ transaction: t });

        await regenerateEditalPdf(id);

        await t.commit();
        
        res.status(200).json({ message: "Edital assinado com sucesso!", data: sessao });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao assinar o edital:", error);
        res.status(500).json({ message: "Falha ao assinar o edital.", errorDetails: error.message });
    }
};