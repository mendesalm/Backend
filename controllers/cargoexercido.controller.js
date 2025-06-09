// backend/controllers/cargoexercido.controller.js
import db from '../models/index.js'; // Importa o objeto db global
// NÃO desestruture os modelos aqui no topo do módulo

// Adicionar um novo cargo para um Maçom específico
// Rota: POST /api/lodgemembers/:lodgeMemberId/cargos
export const addCargoToLodgeMember = async (req, res) => {
  const { lodgeMemberId } = req.params;
  const { nomeCargo, dataInicio, dataTermino } = req.body;

  try {
    // Acessa os modelos diretamente do objeto 'db' DENTRO da função
    if (!db.CargoExercido || !db.LodgeMember) {
      console.error("[addCargoToLodgeMember] Modelos não inicializados no objeto db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelos não inicializados." });
    }

    const member = await db.LodgeMember.findByPk(parseInt(lodgeMemberId, 10));
    if (!member) {
      return res.status(404).json({ message: `Maçom com ID ${lodgeMemberId} não encontrado.` });
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
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro no servidor ao adicionar cargo.', errorDetails: error.message });
  }
};

// Listar todos os cargos de um Maçom específico
// Rota: GET /api/lodgemembers/:lodgeMemberId/cargos
export const getCargosByLodgeMember = async (req, res) => {
  const { lodgeMemberId } = req.params;
  try {
    if (!db.CargoExercido || !db.LodgeMember) {
      console.error("[getCargosByLodgeMember] Modelos não inicializados no objeto db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelos não inicializados." });
    }
    
    const member = await db.LodgeMember.findByPk(parseInt(lodgeMemberId, 10));
    if (!member) {
        return res.status(404).json({ message: `Maçom com ID ${lodgeMemberId} não encontrado.` });
    }

    const cargos = await db.CargoExercido.findAll({
      where: { lodgeMemberId: parseInt(lodgeMemberId, 10) },
      order: [['dataInicio', 'DESC']],
    });
    res.status(200).json(cargos);
  } catch (error) {
    console.error("Erro ao buscar cargos do maçom:", error);
    res.status(500).json({ message: 'Erro ao buscar cargos.', errorDetails: error.message });
  }
};

// Obter um cargo exercido específico por ID
// Rota: GET /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
export const getCargoExercidoById = async (req, res) => {
    const { lodgeMemberId, cargoId } = req.params;
    try {
        if (!db.CargoExercido) {
            console.error("[getCargoExercidoById] Modelo CargoExercido não inicializado no objeto db.");
            return res.status(500).json({ message: "Erro interno: Modelo não inicializado." });
        }
        const cargo = await db.CargoExercido.findOne({
            where: { 
                id: parseInt(cargoId, 10), 
                lodgeMemberId: parseInt(lodgeMemberId, 10) 
            }
        });
        if (!cargo) {
            return res.status(404).json({ message: 'Registro de cargo exercido não encontrado para este maçom.' });
        }
        res.status(200).json(cargo);
    } catch (error) {
        console.error("Erro ao buscar cargo exercido por ID:", error);
        res.status(500).json({ message: 'Erro ao buscar cargo exercido.', errorDetails: error.message });
    }
};

// Atualizar um cargo exercido específico
// Rota: PUT /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
export const updateCargoExercido = async (req, res) => {
  const { lodgeMemberId, cargoId } = req.params;
  const { nomeCargo, dataInicio, dataTermino } = req.body;

  try {
    if (!db.CargoExercido) {
      console.error("[updateCargoExercido] Modelo CargoExercido não inicializado no objeto db.");
      return res.status(500).json({ message: "Erro interno: Modelo CargoExercido não inicializado." });
    }
    const cargo = await db.CargoExercido.findOne({
      where: { 
        id: parseInt(cargoId, 10), 
        lodgeMemberId: parseInt(lodgeMemberId, 10)
      }
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Registro de cargo exercido não encontrado para este maçom.' });
    }
    
    // Para a validação customizada de dataTermino no validador, se ele precisar do valor original
    req.cargoExercidoAnterior = cargo.toJSON();

    const updates = {};
    if (nomeCargo !== undefined) updates.nomeCargo = nomeCargo;
    if (dataInicio !== undefined) updates.dataInicio = dataInicio;
    if (dataTermino !== undefined) updates.dataTermino = dataTermino === '' ? null : dataTermino;

    if (Object.keys(updates).length === 0) {
        return res.status(200).json({ message: "Nenhum dado fornecido para atualização.", cargo });
    }
    
    await cargo.update(updates);
    res.status(200).json(cargo);
  } catch (error) {
    console.error("Erro ao atualizar cargo exercido:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro no servidor ao atualizar cargo.', errorDetails: error.message });
  }
};

// Deletar um cargo exercido específico
// Rota: DELETE /api/lodgemembers/:lodgeMemberId/cargos/:cargoId
export const deleteCargoExercido = async (req, res) => {
  const { lodgeMemberId, cargoId } = req.params;

  try {
    if (!db.CargoExercido) {
      console.error("[deleteCargoExercido] Modelo CargoExercido não inicializado no objeto db.");
      return res.status(500).json({ message: "Erro interno: Modelo CargoExercido não inicializado." });
    }
    const cargo = await db.CargoExercido.findOne({
      where: { 
        id: parseInt(cargoId, 10), 
        lodgeMemberId: parseInt(lodgeMemberId, 10)
      }
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Registro de cargo exercido não encontrado para este maçom.' });
    }

    await cargo.destroy();
    res.status(200).json({ message: 'Cargo exercido deletado com sucesso.' });
  } catch (error) {
    console.error("Erro ao deletar cargo exercido:", error);
    res.status(500).json({ message: 'Erro no servidor ao deletar cargo.', errorDetails: error.message });
  }
};