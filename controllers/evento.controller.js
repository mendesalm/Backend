// controllers/evento.controller.js
import db from "../models/index.js";

// Criar um novo evento
export const createEvento = async (req, res) => {
  const { titulo, descricao, dataHoraInicio, dataHoraFim, local, tipo } =
    req.body;
  const criadoPorId = req.user.id;
  try {
    const novoEvento = await db.Evento.create({
      titulo,
      descricao,
      dataHoraInicio,
      local,
      tipo,
      criadoPorId,
      dataHoraFim: dataHoraFim || null,
    });
    res.status(201).json(novoEvento);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao criar evento.", errorDetails: error.message });
  }
};

// Listar todos os eventos, incluindo os participantes confirmados e seus acompanhantes
export const getAllEventos = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  const { Op } = db.Sequelize;
  const whereClause = {};

  if (dataInicio && dataFim) {
    whereClause.dataHoraInicio = { [Op.between]: [dataInicio, dataFim] };
  }

  try {
    const eventos = await db.Evento.findAll({
      where: whereClause,
      include: [
        { model: db.LodgeMember, as: "criador", attributes: ["NomeCompleto"] },
        {
          model: db.LodgeMember,
          as: "participantes",
          attributes: ["id", "NomeCompleto"],
          through: {
            // CORREÇÃO CRÍTICA: Adicionado o alias da tabela de junção.
            // O Sequelize agora sabe que deve procurar a coluna 'acompanhantes'
            // na tabela de junção que tem o apelido 'confirmacao'.
            as: "confirmacao",
            where: { statusConfirmacao: "Confirmado" },
            attributes: ["acompanhantes"],
          },
          required: false,
        },
      ],
      order: [["dataHoraInicio", "DESC"]],
    });
    res.status(200).json(eventos);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar eventos.",
      errorDetails: error.message,
    });
  }
};

// Obter um evento por ID com a lista completa de participantes
export const getEventoById = async (req, res) => {
  try {
    const evento = await db.Evento.findByPk(req.params.id, {
      include: [
        { model: db.LodgeMember, as: "criador", attributes: ["NomeCompleto"] },
        {
          model: db.LodgeMember,
          as: "participantes",
          attributes: ["id", "NomeCompleto"],
          through: {
            as: "confirmacao",
            attributes: [
              "statusConfirmacao",
              "dataConfirmacao",
              "acompanhantes",
            ],
          },
        },
      ],
    });
    if (!evento)
      return res.status(404).json({ message: "Evento não encontrado." });
    res.status(200).json(evento);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar evento.", errorDetails: error.message });
  }
};

// Atualizar um evento
export const updateEvento = async (req, res) => {
  try {
    const [updated] = await db.Evento.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res.status(404).json({ message: "Evento não encontrado." });
    const updatedEvento = await db.Evento.findByPk(req.params.id);
    res.status(200).json(updatedEvento);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar evento.",
      errorDetails: error.message,
    });
  }
};

// Deletar um evento
export const deleteEvento = async (req, res) => {
  try {
    const deleted = await db.Evento.destroy({ where: { id: req.params.id } });
    if (!deleted)
      return res.status(404).json({ message: "Evento não encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar evento.",
      errorDetails: error.message,
    });
  }
};

// Confirmar/recusar presença do próprio usuário, incluindo acompanhantes
export const confirmarPresenca = async (req, res) => {
  const { statusConfirmacao, acompanhantes } = req.body;
  const { eventoId } = req.params;
  const lodgeMemberId = req.user.id;

  try {
    const [participante, created] = await db.ParticipanteEvento.findOrCreate({
      where: { eventoId: parseInt(eventoId, 10), lodgeMemberId },
      defaults: {
        statusConfirmacao,
        dataConfirmacao: new Date(),
        acompanhantes: acompanhantes || 0,
      },
    });

    if (!created) {
      participante.statusConfirmacao = statusConfirmacao;
      participante.dataConfirmacao = new Date();
      participante.acompanhantes =
        statusConfirmacao === "Confirmado" ? acompanhantes || 0 : 0;
      await participante.save();
    }
    res.status(200).json(participante);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao confirmar presença.",
      errorDetails: error.message,
    });
  }
};
