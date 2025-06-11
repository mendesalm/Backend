// backend/controllers/masonicSession.controller.js
import db from '../models/index.js';
// CORREÇÃO: Removida a desestruturação dos modelos do topo do ficheiro.

// Listar todas as sessões
export const getAllSessions = async (req, res) => {
  try {
    // CORREÇÃO: Usar os modelos diretamente a partir do objeto `db`
    const sessions = await db.MasonicSession.findAll({
      include: [
        {
          model: db.Ata,
          as: 'ata',
          attributes: ['id', 'numero', 'ano'],
          required: false // Traz a sessão mesmo que não tenha ata
        },
      ],
      order: [['dataSessao', 'DESC']],
    });

    // Adiciona a contagem de presentes e visitantes
    const sessionsWithCounts = await Promise.all(sessions.map(async (session) => {
        const presentesCount = await db.SessionAttendee.count({ where: { sessionId: session.id } });
        const visitantesCount = await db.VisitanteSessao.count({ where: { masonicSessionId: session.id } });
        return {
            ...session.toJSON(),
            presentesCount,
            visitantesCount
        };
    }));

    res.status(200).json(sessionsWithCounts);
  } catch (error) {
    console.error("Erro em getAllSessions:", error);
    res.status(500).json({ message: 'Erro ao listar sessões maçónicas.', errorDetails: error.message });
  }
};

// Obter uma sessão por ID
export const getSessionById = async (req, res) => {
  try {
    const session = await db.MasonicSession.findByPk(req.params.id, {
      include: [
        { model: db.Ata, as: 'ata', required: false },
        { model: db.LodgeMember, as: 'presentes', attributes: ['id', 'NomeCompleto'], through: { attributes: [] } },
        { model: db.VisitanteSessao, as: 'visitantes', attributes: ['id', 'nomeCompleto', 'graduacao', 'loja'] }
      ]
    });
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error("Erro em getSessionById:", error);
    res.status(500).json({ message: 'Erro ao buscar detalhes da sessão.', errorDetails: error.message });
  }
};

// Criar uma nova sessão
export const createSession = async (req, res) => {
    const {
        dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia,
        presentesLodgeMemberIds, visitantes, numeroAta, anoAta
    } = req.body;
    
    const transaction = await db.sequelize.transaction();

    try {
        const novaSessao = await db.MasonicSession.create({
            dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia
        }, { transaction });

        if (presentesLodgeMemberIds && presentesLodgeMemberIds.length > 0) {
            const attendees = presentesLodgeMemberIds.map(id => ({ sessionId: novaSessao.id, lodgeMemberId: id }));
            await db.SessionAttendee.bulkCreate(attendees, { transaction });
        }

        if (visitantes && visitantes.length > 0) {
            const parsedVisitantes = typeof visitantes === 'string' ? JSON.parse(visitantes) : visitantes;
            const visitorsToCreate = parsedVisitantes.map(v => ({ ...v, masonicSessionId: novaSessao.id }));
            await db.VisitanteSessao.bulkCreate(visitorsToCreate, { transaction });
        }

        if (req.file) {
            await db.Ata.create({
                numero: numeroAta,
                ano: anoAta,
                path: req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length),
                sessionId: novaSessao.id
            }, { transaction });
        }
        
        await transaction.commit();
        res.status(201).json(novaSessao);
    } catch (error) {
        await transaction.rollback();
        console.error("Erro em createSession:", error);
        res.status(500).json({ message: 'Erro ao criar sessão.', errorDetails: error.message });
    }
};

// --- FUNÇÃO ADICIONADA ---
// Atualizar uma sessão existente
export const updateSession = async (req, res) => {
    const { id } = req.params;
    const { dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia } = req.body;
    const transaction = await db.sequelize.transaction();
    try {
        const session = await db.MasonicSession.findByPk(id);
        if (!session) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Sessão não encontrada.' });
        }

        await session.update({
            dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia
        }, { transaction });
        
        // Lógica para atualizar a ata, se um novo ficheiro for enviado
        if (req.file) {
           // Opcional: remover a ata antiga do sistema de ficheiros
           const oldAta = await db.Ata.findOne({ where: { sessionId: id }});
           if (oldAta) {
               // fs.unlink... (lógica de remoção de ficheiro)
               await oldAta.destroy({ transaction });
           }
           await db.Ata.create({
               // ...dados da nova ata
               path: req.file.path.replace(/\\/g, '/').substring(req.file.path.replace(/\\/g, '/').indexOf('uploads/') + 'uploads/'.length),
               sessionId: id,
           }, { transaction });
        }
        
        await transaction.commit();
        const updatedSession = await db.MasonicSession.findByPk(id, { include: ['ata'] });
        res.status(200).json(updatedSession);
    } catch (error) {
        await transaction.rollback();
        console.error("Erro em updateSession:", error);
        res.status(500).json({ message: 'Erro ao atualizar sessão.', errorDetails: error.message });
    }
};

// --- FUNÇÃO ADICIONADA ---
// Deletar uma sessão
export const deleteSession = async (req, res) => {
    const { id } = req.params;
    try {
        const session = await db.MasonicSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Sessão não encontrada.' });
        }

        // A associação `onDelete: 'CASCADE'` no modelo deve cuidar da remoção
        // de Atas, SessionAttendees e VisitantesSessao relacionados.
        await session.destroy();

        res.status(204).send(); // 204 No Content é a resposta padrão para delete bem-sucedido
    } catch (error) {
        console.error("Erro em deleteSession:", error);
        res.status(500).json({ message: 'Erro ao deletar sessão.', errorDetails: error.message });
    }
};
