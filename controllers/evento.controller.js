// controllers/evento.controller.js
import db from '../models/index.js';
// CORREÇÃO: Removida a desestruturação dos modelos do topo do ficheiro
// const { Evento, LodgeMember, ParticipanteEvento, Sequelize } = db;

// Criar um novo evento
export const createEvento = async (req, res) => {
  const { titulo, descricao, dataHoraInicio, dataHoraFim, local, tipo } = req.body;
  const criadoPorId = req.user.id;
  try {
    // CORREÇÃO: Usar db.Evento
    const novoEvento = await db.Evento.create({
      titulo, descricao, dataHoraInicio, local, tipo, criadoPorId,
      dataHoraFim: dataHoraFim || null,
    });
    res.status(201).json(novoEvento);
  } catch (error) { res.status(500).json({ message: 'Erro ao criar evento.', errorDetails: error.message }); }
};

// Listar todos os eventos (com filtro de período)
export const getAllEventos = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  const { Op } = db.Sequelize; // Obter Op de forma segura
  const whereClause = {};
  
  if (dataInicio && dataFim) {
    whereClause.dataHoraInicio = { [Op.between]: [dataInicio, dataFim] };
  }
  
  try {
    // CORREÇÃO: Usar os modelos a partir do objeto `db`
    const eventos = await db.Evento.findAll({
      where: whereClause,
      include: [{ model: db.LodgeMember, as: 'criador', attributes: ['NomeCompleto'] }],
      order: [['dataHoraInicio', 'ASC']],
    });
    res.status(200).json(eventos);
  } catch (error) { res.status(500).json({ message: 'Erro ao listar eventos.', errorDetails: error.message }); }
};

// Obter um evento por ID com a lista de participantes
export const getEventoById = async (req, res) => {
  try {
    // CORREÇÃO: Usar os modelos a partir do objeto `db`
    const evento = await db.Evento.findByPk(req.params.id, {
      include: [
        { model: db.LodgeMember, as: 'criador', attributes: ['NomeCompleto'] },
        {
          model: db.LodgeMember, as: 'participantes', attributes: ['id', 'NomeCompleto'],
          through: { as: 'confirmacao', attributes: ['statusConfirmacao', 'dataConfirmacao'] }
        }
      ]
    });
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' });
    res.status(200).json(evento);
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar evento.', errorDetails: error.message }); }
};

// Atualizar um evento
export const updateEvento = async (req, res) => {
  try {
    // CORREÇÃO: Usar db.Evento
    const [updated] = await db.Evento.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: 'Evento não encontrado.' });
    const updatedEvento = await db.Evento.findByPk(req.params.id);
    res.status(200).json(updatedEvento);
  } catch (error) { res.status(500).json({ message: 'Erro ao atualizar evento.', errorDetails: error.message }); }
};

// Deletar um evento
export const deleteEvento = async (req, res) => {
  try {
    // CORREÇÃO: Usar db.Evento
    const deleted = await db.Evento.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Evento não encontrado.' });
    res.status(204).send();
  } catch (error) { res.status(500).json({ message: 'Erro ao deletar evento.', errorDetails: error.message }); }
};

// Confirmar/recusar presença do próprio usuário
export const confirmarPresenca = async (req, res) => {
  const { statusConfirmacao } = req.body; // 'Confirmado' ou 'Recusado'
  const { eventoId } = req.params;
  const lodgeMemberId = req.user.id;

  try {
    // CORREÇÃO: Usar db.ParticipanteEvento
    const [participante, created] = await db.ParticipanteEvento.findOrCreate({
      where: { eventoId: parseInt(eventoId, 10), lodgeMemberId },
      defaults: { statusConfirmacao, dataConfirmacao: new Date() }
    });

    if (!created) {
      participante.statusConfirmacao = statusConfirmacao;
      participante.dataConfirmacao = new Date();
      await participante.save();
    }
    res.status(200).json(participante);
  } catch (error) { res.status(500).json({ message: 'Erro ao confirmar presença.', errorDetails: error.message }); }
};
