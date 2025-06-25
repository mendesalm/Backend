// backend/controllers/cargoexercido.controller.js
import db from "../models/index.js";

/**
 * Adiciona um novo cargo para um Maçom específico.
 * Rota: POST /api/lodgemembers/:lodgeMemberId/cargos
 */
export const addCargoToLodgeMember = async (req, res) => {
  const { lodgeMemberId } = req.params;
  const { nomeCargo, dataInicio, dataTermino } = req.body;

  try {
    // Verifica se o membro existe antes de adicionar o cargo
    const member = await db.LodgeMember.findByPk(lodgeMemberId);
    if (!member) {
      return res
        .status(404)
        .json({ message: `Maçom com ID ${lodgeMemberId} não encontrado.` });
    }

    const novoCargo = await db.CargoExercido.create({
      nomeCargo,
      dataInicio,
      dataTermino: dataTermino || null,
      lodgeMemberId: parseInt(lodgeMemberId, 10),
    });

    res.status(201).json(novoCargo);
  } catch (error) {
    console.error("Erro ao adicionar cargo ao maçom:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({
        message: "Erro no servidor ao adicionar cargo.",
        errorDetails: error.message,
      });
  }
};

/**
 * Lista todos os cargos de um Maçom específico.
 * Rota: GET /api/lodgemembers/:lodgeMemberId/cargos
 */
export const getCargosByLodgeMember = async (req, res) => {
  const { lodgeMemberId } = req.params;
  try {
    // Adicionada verificação para garantir que o membro existe primeiro.
    const member = await db.LodgeMember.findByPk(lodgeMemberId);
    if (!member) {
      return res
        .status(404)
        .json({ message: `Maçom com ID ${lodgeMemberId} não encontrado.` });
    }

    // Apenas listamos os cargos. O frontend já sabe a qual membro eles pertencem.
    // A remoção de um 'include' circular aqui é crucial para evitar loops.
    const cargos = await db.CargoExercido.findAll({
      where: { lodgeMemberId: parseInt(lodgeMemberId, 10) },
      order: [["dataInicio", "DESC"]],
    });
    res.status(200).json(cargos);
  } catch (error) {
    console.error("Erro ao buscar cargos do maçom:", error);
    res
      .status(500)
      .json({ message: "Erro ao buscar cargos.", errorDetails: error.message });
  }
};

/**
 * Obtém um cargo exercido específico por ID.
 * Rota: GET /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
 */
export const getCargoExercidoById = async (req, res) => {
  const { lodgeMemberId, cargoId } = req.params;
  try {
    const cargo = await db.CargoExercido.findOne({
      where: {
        id: parseInt(cargoId, 10),
        lodgeMemberId: parseInt(lodgeMemberId, 10),
      },
    });
    if (!cargo) {
      return res
        .status(404)
        .json({
          message: "Registro de cargo exercido não encontrado para este maçom.",
        });
    }
    res.status(200).json(cargo);
  } catch (error) {
    console.error("Erro ao buscar cargo exercido por ID:", error);
    res
      .status(500)
      .json({
        message: "Erro ao buscar cargo exercido.",
        errorDetails: error.message,
      });
  }
};

/**
 * Atualiza um cargo exercido específico.
 * Rota: PUT /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
 */
export const updateCargoExercido = async (req, res) => {
  const { lodgeMemberId, cargoId } = req.params;
  const { nomeCargo, dataInicio, dataTermino } = req.body;

  try {
    const cargo = await db.CargoExercido.findOne({
      where: {
        id: parseInt(cargoId, 10),
        lodgeMemberId: parseInt(lodgeMemberId, 10),
      },
    });

    if (!cargo) {
      return res
        .status(404)
        .json({
          message: "Registro de cargo exercido não encontrado para este maçom.",
        });
    }

    // Atualiza o registro com os novos dados
    await cargo.update({ nomeCargo, dataInicio, dataTermino });

    res.status(200).json(cargo);
  } catch (error) {
    console.error("Erro ao atualizar cargo exercido:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({
          message: "Erro de validação.",
          errors: error.errors.map((e) => ({ msg: e.message, path: e.path })),
        });
    }
    res
      .status(500)
      .json({
        message: "Erro no servidor ao atualizar cargo.",
        errorDetails: error.message,
      });
  }
};

/**
 * Deleta um cargo exercido específico.
 * Rota: DELETE /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
 */
export const deleteCargoExercido = async (req, res) => {
  const { lodgeMemberId, cargoId } = req.params;

  try {
    const cargo = await db.CargoExercido.findOne({
      where: {
        id: parseInt(cargoId, 10),
        lodgeMemberId: parseInt(lodgeMemberId, 10),
      },
    });

    if (!cargo) {
      return res
        .status(404)
        .json({
          message: "Registro de cargo exercido não encontrado para este maçom.",
        });
    }

    await cargo.destroy();
    res.status(200).json({ message: "Cargo exercido deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar cargo exercido:", error);
    res
      .status(500)
      .json({
        message: "Erro no servidor ao deletar cargo.",
        errorDetails: error.message,
      });
  }
};
