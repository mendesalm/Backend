// backend/controllers/masonicsession.controller.js
import db from '../models/index.js';
const { MasonicSession, LodgeMember, Ata, VisitanteSessao, SessionAttendee, sequelize } = db; // Adicionado SessionAttendee explicitamente se precisar
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Para construir caminhos para fs.unlink se necessário

// Criar uma nova Sessão Maçônica
export const createSession = async (req, res) => {
  const t = await sequelize.transaction();
  let ataFileWasUploaded = false;
  let ataPathToDeleteOnError = req.file ? req.file.path : null;

  try {
    if (!MasonicSession || !LodgeMember || !Ata || !VisitanteSessao || !sequelize) {
      return res.status(500).json({ message: "Erro interno: Modelos ou Sequelize não inicializados." });
    }
    const {
      dataSessao, tipoSessao, subtipoSessao, responsavelJantarLodgeMemberId,
      conjugeResponsavelJantarNome, presentesLodgeMemberIds, troncoDeBeneficencia,
      numeroAta, anoAta, dataDeAprovacaoAta,
      visitantes // Array de objetos de visitantes
    } = req.body;

    const newSession = await MasonicSession.create({
      dataSessao, tipoSessao, subtipoSessao, troncoDeBeneficencia,
      responsavelJantarLodgeMemberId: responsavelJantarLodgeMemberId ? parseInt(responsavelJantarLodgeMemberId, 10) : null,
      conjugeResponsavelJantarNome: conjugeResponsavelJantarNome || null,
    }, { transaction: t });

    // Adicionar os maçons presentes (LodgeMembers)
    if (presentesLodgeMemberIds && Array.isArray(presentesLodgeMemberIds)) {
      const validLodgeMemberIds = presentesLodgeMemberIds
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && id > 0);
      if (validLodgeMemberIds.length > 0) {
        await newSession.setPresentes(validLodgeMemberIds, { transaction: t });
      }
    }

    // Adicionar os visitantes (VisitanteSessao)
    if (visitantes && Array.isArray(visitantes) && visitantes.length > 0) {
      const visitantesParaCriar = visitantes.map(vis => ({
        nomeCompleto: vis.nomeCompleto,
        graduacao: vis.graduacao || null,
        cim: vis.cim || null,
        potencia: vis.potencia || null,
        loja: vis.loja || null,
        oriente: vis.oriente || null,
        masonicSessionId: newSession.id
      }));
      await VisitanteSessao.bulkCreate(visitantesParaCriar, { transaction: t, validate: true });
    }

    if (req.file) {
      // Validação de numeroAta e anoAta já foi feita pelo express-validator
      await Ata.create({
        numero: numeroAta, ano: parseInt(anoAta, 10), 
        dataDeAprovacao: dataDeAprovacaoAta || null,
        path: req.file.path, // Caminho salvo pelo multer
        sessionId: newSession.id,
      }, { transaction: t });
      ataFileWasUploaded = true; // Sinaliza que o arquivo foi usado
      ataPathToDeleteOnError = null; // Não deletar se a transação for bem-sucedida
    }

    await t.commit();

    const result = await MasonicSession.findByPk(newSession.id, {
      include: [
        { model: LodgeMember, as: 'responsavelJantar', attributes: ['id', 'NomeCompleto', 'Email'], required: false },
        { model: LodgeMember, as: 'presentes', attributes: ['id', 'NomeCompleto', 'Email'], through: { attributes: [] }, required: false },
        { model: Ata, as: 'ata', required: false },
        { model: VisitanteSessao, as: 'visitantes', required: false }
      ]
    });
    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error("Erro ao criar sessão:", error);
    if (ataPathToDeleteOnError) { // Se um arquivo foi upado mas a transação falhou
        fs.unlink(ataPathToDeleteOnError, (errUnlink) => { 
            if (errUnlink) console.error("Erro ao deletar arquivo de ata órfão após falha na transação:", errUnlink, ataPathToDeleteOnError);
            else console.log("Arquivo de ata órfão deletado:", ataPathToDeleteOnError);
        });
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Erro de validação ou chave estrangeira.', errors: error.errors ? error.errors.map(e=>({msg: e.message, path: e.path})) : error.message });
    }
    res.status(500).json({ message: 'Erro ao criar sessão.', errorDetails: error.message });
  }
};

// Listar todas as Sessões
export const getAllSessions = async (req, res) => {
  try {
    if (!MasonicSession || !LodgeMember || !Ata || !VisitanteSessao) {
      return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }
    const sessions = await MasonicSession.findAll({
      include: [
        { model: LodgeMember, as: 'responsavelJantar', attributes: ['id', 'NomeCompleto', 'Email'], required: false },
        { model: LodgeMember, as: 'presentes', attributes: ['id', 'NomeCompleto', 'Email'], through: { attributes: [] }, required: false },
        { model: Ata, as: 'ata', attributes: ['id', 'numero', 'ano', 'path', 'dataDeAprovacao'], required: false },
        { model: VisitanteSessao, as: 'visitantes', required: false }
      ],
      order: [['dataSessao', 'DESC']],
    });
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    res.status(500).json({ message: 'Erro ao buscar sessões.', errorDetails: error.message });
  }
};

// Obter uma Sessão por ID
export const getSessionById = async (req, res) => {
  try {
    if (!MasonicSession || !LodgeMember || !Ata || !VisitanteSessao) {
      return res.status(500).json({ message: "Erro interno: Modelos não inicializados." });
    }
    const sessionId = parseInt(req.params.id, 10);
    if(isNaN(sessionId)) return res.status(400).json({ message: 'ID da sessão inválido.'});

    const session = await MasonicSession.findByPk(sessionId, {
      include: [
        { model: LodgeMember, as: 'responsavelJantar', attributes: ['id', 'NomeCompleto', 'Email'], required: false },
        { model: LodgeMember, as: 'presentes', attributes: ['id', 'NomeCompleto', 'Email'], through: { attributes: [] }, required: false },
        { model: Ata, as: 'ata', required: false },
        { model: VisitanteSessao, as: 'visitantes', required: false }
      ]
    });
    if (!session) return res.status(404).json({ message: 'Sessão não encontrada.' });
    res.status(200).json(session);
  } catch (error) {
    console.error("Erro ao buscar sessão por ID:", error);
    res.status(500).json({ message: 'Erro ao buscar sessão por ID.', errorDetails: error.message });
  }
};

// Atualizar uma Sessão
export const updateSession = async (req, res) => {
  const t = await sequelize.transaction();
  const sessionId = parseInt(req.params.id, 10);
  if(isNaN(sessionId)) return res.status(400).json({ message: 'ID da sessão inválido.'});

  let oldAtaPathToDelete = null;
  let newAtaPathForCleanup = req.file ? req.file.path : null;

  try {
    if (!MasonicSession || !LodgeMember || !Ata || !VisitanteSessao || !sequelize) {
      await t.rollback();
      return res.status(500).json({ message: "Erro interno: Modelos ou Sequelize não inicializados." });
    }
    const session = await MasonicSession.findByPk(sessionId, { 
        include: [{model: Ata, as: 'ata'}], // Inclui a ata para verificar se existe e pegar o path antigo
        transaction: t 
    });
    if (!session) {
      await t.rollback();
      if (newAtaPathForCleanup) fs.unlink(newAtaPathForCleanup, (err) => { if (err) console.error("Erro ao deletar arquivo órfão (ata) em update:", err);});
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }
    if(session.ata) oldAtaPathToDelete = session.ata.path;

    const {
      dataSessao, tipoSessao, subtipoSessao, responsavelJantarLodgeMemberId,
      conjugeResponsavelJantarNome, presentesLodgeMemberIds, troncoDeBeneficencia,
      numeroAta, anoAta, dataDeAprovacaoAta,
      visitantes // Array de objetos de visitantes
    } = req.body;

    // Atualiza os campos da sessão principal
    const sessionUpdates = pick(req.body, ['dataSessao', 'tipoSessao', 'subtipoSessao', 'troncoDeBeneficencia', 'responsavelJantarLodgeMemberId', 'conjugeResponsavelJantarNome']);
    Object.keys(sessionUpdates).forEach(key => (sessionUpdates[key] === undefined) && delete sessionUpdates[key]);
    if (sessionUpdates.responsavelJantarLodgeMemberId) sessionUpdates.responsavelJantarLodgeMemberId = parseInt(sessionUpdates.responsavelJantarLodgeMemberId, 10);


    await session.update(sessionUpdates, { transaction: t });

    // Atualiza a lista de presentes
    if (presentesLodgeMemberIds !== undefined) {
      const validLodgeMemberIds = Array.isArray(presentesLodgeMemberIds)
        ? presentesLodgeMemberIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0)
        : [];
      await session.setPresentes(validLodgeMemberIds, { transaction: t });
    }

    // Atualizar visitantes: remover todos os antigos e adicionar os novos
    if (visitantes !== undefined) {
      await VisitanteSessao.destroy({ where: { masonicSessionId: session.id }, transaction: t });
      if (Array.isArray(visitantes) && visitantes.length > 0) {
        const visitantesParaCriar = visitantes.map(vis => ({
          nomeCompleto: vis.nomeCompleto,
          graduacao: vis.graduacao || null,
          cim: vis.cim || null,
          potencia: vis.potencia || null,
          loja: vis.loja || null,
          oriente: vis.oriente || null,
          masonicSessionId: session.id
        }));
        await VisitanteSessao.bulkCreate(visitantesParaCriar, { transaction: t, validate: true });
      }
    }

    // Lida com a ata (atualização ou criação)
    if (req.file) { // Novo arquivo de ata enviado
      if (!numeroAta || !anoAta) {
        await t.rollback();
        fs.unlink(req.file.path, (err) => { if (err) console.error("Erro ao deletar arquivo órfão (ata) - validação de metadados:", err);});
        return res.status(400).json({ message: 'Número e ano da ata são obrigatórios se um novo arquivo de ata for enviado.' });
      }
      const ataData = {
        numero: numeroAta, ano: parseInt(anoAta, 10),
        dataDeAprovacao: dataDeAprovacaoAta || null,
        path: req.file.path, sessionId: session.id
      };
      if (session.ata) {
        await session.ata.update(ataData, { transaction: t });
      } else {
        await Ata.create(ataData, { transaction: t });
      }
      newAtaPathForCleanup = null; // Arquivo novo foi associado, não deletar em erro de commit
    } else if (numeroAta !== undefined || anoAta !== undefined || dataDeAprovacaoAta !== undefined) {
      if (session.ata) {
        const ataUpdates = {};
        if(numeroAta !== undefined) ataUpdates.numero = numeroAta;
        if(anoAta !== undefined) ataUpdates.ano = parseInt(anoAta,10);
        if(dataDeAprovacaoAta !== undefined) ataUpdates.dataDeAprovacao = dataDeAprovacaoAta || null;
        if(Object.keys(ataUpdates).length > 0) {
            await session.ata.update(ataUpdates, { transaction: t });
        }
      } else if (numeroAta && anoAta) { // Tentando criar/atualizar metadados de ata sem arquivo e sem ata prévia
        await t.rollback();
        return res.status(400).json({ message: 'Não é possível definir dados da ata sem um arquivo de ata se não houver uma ata prévia associada.' });
      }
    }

    await t.commit();

    if (req.file && oldAtaPathToDelete && oldAtaPathToDelete !== req.file.path) {
        const fullOldPath = path.resolve(oldAtaPathToDelete); // Ajuste este path se necessário
        fs.unlink(fullOldPath, err => { 
            if (err) console.error("Erro ao deletar arquivo de ata antigo após update bem-sucedido:", err, "Caminho:", fullOldPath);
            else console.log("Arquivo de ata antigo deletado:", fullOldPath);
        });
    }
    
    const updatedResult = await MasonicSession.findByPk(session.id, { 
      include: [
        { model: LodgeMember, as: 'responsavelJantar', attributes: ['id', 'NomeCompleto', 'Email'], required: false },
        { model: LodgeMember, as: 'presentes', attributes: ['id', 'NomeCompleto', 'Email'], through: { attributes: [] }, required: false },
        { model: Ata, as: 'ata', required: false },
        { model: VisitanteSessao, as: 'visitantes', required: false }
      ]
    });
    res.status(200).json(updatedResult);
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar sessão:", error);
    if (newAtaPathForCleanup) { 
        fs.unlink(newAtaPathForCleanup, (errUnlink) => { 
            if (errUnlink) console.error("Erro ao deletar arquivo de ata (novo) órfão após falha na transação de update:", errUnlink, newAtaPathForCleanup);
            else console.log("Arquivo de ata (novo) órfão deletado:", newAtaPathForCleanup);
        });
    }
    if (error.name === 'SequelizeValidationError') return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e=>({msg: e.message, path: e.path}))});
    res.status(500).json({ message: 'Erro ao atualizar sessão.', errorDetails: error.message });
  }
};

// Deletar uma Sessão
export const deleteSession = async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  if(isNaN(sessionId)) return res.status(400).json({ message: 'ID da sessão inválido.'});

  const t = await sequelize.transaction();
  try {
    if (!MasonicSession || !Ata || !sequelize) {
      await t.rollback();
      return res.status(500).json({ message: "Erro interno: Modelos ou Sequelize não inicializados." });
    }
    const session = await MasonicSession.findByPk(sessionId, { include: [{model: Ata, as: 'ata'}], transaction: t });
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }

    const ataPathToDelete = session.ata?.path;

    await session.destroy({ transaction: t }); // CASCADE deve cuidar de SessionAttendees, Atas e VisitantesSessao
    
    await t.commit();

    if (ataPathToDelete) {
      // O caminho salvo pelo multer é geralmente o caminho completo. Verifique sua config do multer.
      fs.unlink(ataPathToDelete, err => { 
        if (err) console.error("Erro ao deletar arquivo da ata do filesystem:", err, "Caminho:", ataPathToDelete);
        else console.log("Arquivo da ata deletado do filesystem:", ataPathToDelete);
      });
    }
    res.status(200).json({ message: 'Sessão deletada com sucesso.' });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao deletar sessão:", error);
    res.status(500).json({ message: 'Erro ao deletar sessão.', errorDetails: error.message });
  }
};