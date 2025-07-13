// controllers/visitacao.controller.js
import db from "../models/index.js";

/**
 * Procura na nova tabela 'Lojas' para a funcionalidade de autocompletar.
 * Retorna uma lista de objetos de Loja.
 */
export const searchLojasVisitadas = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      message: "O termo de busca deve ter no mínimo 2 caracteres.",
    });
  }

  try {
    const { Op } = db.Sequelize;
    const lojas = await db.Loja.findAll({
      where: {
        nome: {
          [Op.like]: `%${q}%`,
        },
      },
      limit: 10,
    });

    res.status(200).json(lojas);
  } catch (error) {
    console.error("Erro ao buscar lojas para autocompletar:", error);
    res.status(500).json({
      message: "Erro no servidor ao buscar lojas.",
      errorDetails: error.message,
    });
  }
};

/**
 * Cria um novo registro de visita, utilizando a tabela centralizada de Lojas.
 * **Esta função foi tornada mais robusta para evitar o erro 500.**
 */
export const createVisita = async (req, res) => {
  const { dadosLoja, ...dadosVisita } = req.body;
  const t = await db.sequelize.transaction();

  try {
    // Validação explícita para garantir que os dados da loja foram enviados corretamente.
    if (!dadosLoja || !dadosLoja.nome) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Dados da loja inválidos. O objeto 'dadosLoja' contendo a propriedade 'nome' é obrigatório.",
      });
    }

    // Procura pela loja ou cria uma nova se não existir (findOrCreate)
    const [loja] = await db.Loja.findOrCreate({
      where: {
        nome: dadosLoja.nome,
        cidade: dadosLoja.cidade || null,
        estado: dadosLoja.estado || null,
      },
      defaults: dadosLoja,
      transaction: t,
    });

    // Cria o registro da visita associando o ID da loja
    const visita = await db.Visita.create(
      {
        ...dadosVisita,
        lojaId: loja.id,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(visita);
  } catch (error) {
    await t.rollback();
    console.error("Erro detalhado ao registrar visita:", error); // Log mais detalhado do erro
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Erro de validação.",
        errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
      });
    }
    res.status(500).json({
      message: "Erro ao registrar visita.",
      errorDetails: error.message,
    });
  }
};

// Listar todas as visitas, com filtros
export const getAllVisitas = async (req, res) => {
  try {
    const { lodgeMemberId } = req.query;
    const whereClause = {};
    if (lodgeMemberId) whereClause.lodgeMemberId = lodgeMemberId;

    const visitas = await db.Visita.findAll({
      where: whereClause,
      include: [
        {
          model: db.LodgeMember,
          as: "visitante",
          attributes: ["id", "NomeCompleto"],
        },
        { model: db.Loja, as: "loja" },
      ],
      order: [["dataSessao", "DESC"]],
    });
    res.status(200).json(visitas);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar visitas.",
      errorDetails: error.message,
    });
  }
};

// Obter uma visita por ID
export const getVisitaById = async (req, res) => {
  try {
    const visita = await db.Visita.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: "visitante",
          attributes: ["id", "NomeCompleto"],
        },
        { model: db.Loja, as: "loja" },
      ],
    });
    if (!visita) {
      return res
        .status(404)
        .json({ message: "Registro de visita não encontrado." });
    }
    res.status(200).json(visita);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar registro de visita.",
      errorDetails: error.message,
    });
  }
};

// Atualizar uma visita
export const updateVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const { credencialAcesso, id: userId } = req.user;

    const whereClause = { id: parseInt(id, 10) };

    if (credencialAcesso !== "Webmaster" && credencialAcesso !== "Diretoria") {
      whereClause.lodgeMemberId = userId;
    }

    const [updated] = await db.Visita.update(req.body, { where: whereClause });

    if (!updated) {
      return res
        .status(404)
        .json({
          message: "Registro de visita não encontrado ou permissão negada.",
        });
    }

    const updatedVisita = await db.Visita.findByPk(id);
    res.status(200).json(updatedVisita);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Erro de validação.",
        errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
      });
    }
    res.status(500).json({
      message: "Erro ao atualizar registro de visita.",
      errorDetails: error.message,
    });
  }
};

// Deletar uma visita
export const deleteVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const { credencialAcesso, id: userId } = req.user;

    const whereClause = { id: parseInt(id, 10) };

    if (credencialAcesso !== "Webmaster" && credencialAcesso !== "Diretoria") {
      whereClause.lodgeMemberId = userId;
    }

    const deleted = await db.Visita.destroy({ where: whereClause });

    if (!deleted) {
      return res
        .status(404)
        .json({
          message: "Registro de visita não encontrado ou permissão negada.",
        });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar registro de visita.",
      errorDetails: error.message,
    });
  }
};
