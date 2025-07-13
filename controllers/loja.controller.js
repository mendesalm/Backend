// controllers/loja.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";
import { normalizeString } from "../utils/normalizeString.js"; // 1. Importa a nova função

// Criar uma nova Loja com validação de duplicidade
export const createLoja = async (req, res) => {
  const { nome, numero, cidade, estado, potencia } = req.body;

  // Garante que o nome e o número foram fornecidos
  if (!nome || !numero) {
    return res
      .status(400)
      .json({ message: "O nome e o número da loja são obrigatórios." });
  }

  try {
    // 2. Normaliza os campos relevantes para uma verificação consistente
    const normalizedNome = normalizeString(nome);
    const normalizedCidade = normalizeString(cidade);

    // 3. Verifica se já existe uma loja com o mesmo nome normalizado E cidade, OU com o mesmo número
    const existingLoja = await db.Loja.findOne({
      where: {
        [Op.or]: [
          {
            nome: normalizedNome,
            cidade: normalizedCidade, // Combinação para evitar lojas com mesmo nome em cidades diferentes
          },
          {
            numero: numero,
          },
        ],
      },
    });

    // 4. Se encontrar uma duplicata, retorna um erro 409 Conflict
    if (existingLoja) {
      return res.status(409).json({
        message:
          "Já existe uma loja com esta combinação de nome e cidade, ou com este número.",
        details: existingLoja,
      });
    }

    // 5. Se não houver duplicata, cria a nova loja
    // Nota: O Sequelize não tem um "setter" automático como o Mongoose,
    // então passamos os dados originais. A validação já foi feita com os dados normalizados.
    const novaLoja = await db.Loja.create({
      nome,
      numero,
      cidade,
      estado,
      potencia,
    });

    res
      .status(201)
      .json({ message: "Loja criada com sucesso!", loja: novaLoja });
  } catch (error) {
    // O Sequelize pode retornar um erro de violação de constraint única se houver uma "race condition"
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({
          message:
            "Erro de duplicidade: O nome, número ou outra combinação única de campos já existe.",
        });
    }
    console.error("Erro ao criar loja:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao criar loja.",
        errorDetails: error.message,
      });
  }
};

// Obter todas as Lojas
export const getAllLojas = async (req, res) => {
  try {
    const lojas = await db.Loja.findAll({ order: [["nome", "ASC"]] });
    res.status(200).json(lojas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar lojas.", errorDetails: error.message });
  }
};

// Obter uma Loja por ID
export const getLojaById = async (req, res) => {
  try {
    const loja = await db.Loja.findByPk(req.params.id);
    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    res.status(200).json(loja);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar loja.", errorDetails: error.message });
  }
};

// Atualizar uma Loja
export const updateLoja = async (req, res) => {
  try {
    const [updated] = await db.Loja.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    const updatedLoja = await db.Loja.findByPk(req.params.id);
    res.status(200).json(updatedLoja);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao atualizar loja.",
        errorDetails: error.message,
      });
  }
};

// Apagar uma Loja
export const deleteLoja = async (req, res) => {
  try {
    const deleted = await db.Loja.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao apagar loja.", errorDetails: error.message });
  }
};

// Função de pesquisa para autocompletar
export const searchLojasVisitadas = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 1) {
    return res.status(400).json({
      message: "O termo de busca deve ter no mínimo 1 caractere.",
    });
  }

  try {
    const whereClause = {
      [Op.or]: [{ nome: { [Op.like]: `%${q}%` } }],
    };

    if (!isNaN(parseInt(q, 10))) {
      whereClause[Op.or].push({ numero: { [Op.eq]: parseInt(q, 10) } });
    }

    const lojas = await db.Loja.findAll({
      where: whereClause,
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
