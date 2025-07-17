import db from '../models/index.js';

import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
  allowedTags: [ 'b', 'i', 'em', 'strong', 'br', 'p', 'u' ],
  allowedAttributes: {}
};

// Criar e Salvar uma nova Mensagem
const create = async (req, res) => {
  try {
    const { tipo, subtipo, conteudo } = req.body;
    if (!tipo || !subtipo || !conteudo) {
      return res.status(400).send({ message: 'Todos os campos são obrigatórios: tipo, subtipo, conteudo.' });
    }

    const conteudoLimpo = sanitizeHtml(conteudo, sanitizeOptions);

    const novaMensagem = await db.CorpoMensagem.create({ tipo, subtipo, conteudo: conteudoLimpo });
    res.status(201).send(novaMensagem);
  } catch (error) {
    res.status(500).send({ message: error.message || 'Ocorreu um erro ao criar a mensagem.' });
  }
};

// Listar todas as mensagens com filtros
const findAll = async (req, res) => {
  try {
    const { tipo, subtipo } = req.query;
    const whereConditions = {};

    if (tipo && tipo !== "") {
      whereConditions.tipo = tipo;
    }
    if (subtipo && subtipo !== "") {
      whereConditions.subtipo = subtipo;
    }

    const mensagens = await db.CorpoMensagem.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(mensagens);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ message: "Erro interno ao buscar mensagens." });
  }
};

// Atualizar uma mensagem pelo ID
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const corpoUpdate = { ...req.body };

    if (corpoUpdate.conteudo) {
      corpoUpdate.conteudo = sanitizeHtml(corpoUpdate.conteudo, sanitizeOptions);
    }

    const [updated] = await db.CorpoMensagem.update(corpoUpdate, {
      where: { id: id }
    });

    if (updated) {
      const updatedMensagem = await db.CorpoMensagem.findByPk(id);
      res.send(updatedMensagem);
    } else {
      res.status(404).send({ message: `Não foi possível encontrar a mensagem com ID=${id}.` });
    }
  } catch (error) {
    res.status(500).send({ message: `Erro ao atualizar a mensagem com ID=${id}.` });
  }
};

// Deletar uma mensagem pelo ID
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.CorpoMensagem.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({ message: 'Mensagem deletada com sucesso!' });
    } else {
      res.status(404).send({ message: `Não foi possível encontrar a mensagem com ID=${id}.` });
    }
  } catch (error) {
    res.status(500).send({ message: `Erro ao deletar a mensagem com ID=${id}.` });
  }
};

export default {
  create,
  findAll,
  update,
  remove
};