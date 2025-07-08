// backend/controllers/lodgemember.controller.js
import db from "../models/index.js";
import { pick } from "../utils/pick.js";
import path from "path";
// 1. IMPORTAR O SERVIÇO DE PERMISSÕES
import { getAllowedFeaturesForUser } from "../services/permission.service.js";

// Função auxiliar para gerir familiares numa transação
const manageFamiliares = async (lodgeMemberId, familiaresData, transaction) => {
  if (!familiaresData || !Array.isArray(familiaresData)) {
    return;
  }
  const existingFamiliares = await db.FamilyMember.findAll({
    where: { lodgeMemberId },
    transaction,
  });
  const incomingIds = new Set(
    familiaresData.filter((f) => f.id).map((f) => f.id)
  );

  for (const existing of existingFamiliares) {
    if (!incomingIds.has(existing.id)) {
      await existing.destroy({ transaction });
    }
  }

  for (const familiarData of familiaresData) {
    const data = { ...familiarData, lodgeMemberId };
    if (data.email === "") {
      data.email = null;
    }
    try {
      if (familiarData.id) {
        const familiar = await db.FamilyMember.findByPk(familiarData.id, {
          transaction,
        });
        if (familiar) {
          await familiar.update(data, { transaction });
        }
      } else {
        await db.FamilyMember.create(data, { transaction });
      }
    } catch (error) {
      console.error("Erro ao processar familiar:", familiarData, error);
      throw error;
    }
  }
};

/**
 * Obtém o perfil do maçom autenticado, agora incluindo as suas permissões.
 */
export const getMyProfile = async (req, res) => {
  try {
    const member = await db.LodgeMember.findByPk(req.user.id, {
      attributes: {
        exclude: ["password", "resetPasswordToken", "resetPasswordExpires"],
      },
      include: [{ model: db.FamilyMember, as: "familiares", required: false }],
    });
    if (!member) {
      return res.status(404).json({ message: "Maçom não encontrado." });
    }

    // 2. OBTER AS PERMISSÕES DO UTILIZADOR
    const permissions = await getAllowedFeaturesForUser(member);

    const memberJSON = member.toJSON();
    // 3. ANEXAR O ARRAY DE PERMISSÕES À RESPOSTA
    memberJSON.permissions = permissions;

    res.status(200).json(memberJSON);
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    res.status(500).json({
      message: "Erro ao buscar dados do perfil.",
      errorDetails: error.message,
    });
  }
};

/**
 * Atualiza o perfil do maçom autenticado.
 */
export const updateMyProfile = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const member = await db.LodgeMember.findByPk(req.user.id, {
      transaction: t,
    });
    if (!member) {
      await t.rollback();
      return res.status(404).json({ message: "Maçom não encontrado." });
    }
    const allowedFields = [
      "NomeCompleto",
      "CIM",
      "Identidade",
      "Email",
      "FotoPessoal_Caminho",
      "DataNascimento",
      "DataCasamento",
      "Endereco_Rua",
      "Endereco_Numero",
      "Endereco_Bairro",
      "Endereco_Cidade",
      "Endereco_CEP",
      "Telefone",
      "Naturalidade",
      "Nacionalidade",
      "Religiao",
      "NomePai",
      "NomeMae",
      "FormacaoAcademica",
      "Ocupacao",
      "LocalTrabalho",
      "grauFilosofico",
      "password",
    ];

    const updates = pick(req.body, allowedFields);

    if (req.file) {
      updates.FotoPessoal_Caminho = path
        .join("uploads", "fotos_perfil", req.file.filename)
        .replace(/\\/g, "/");
    }

    await member.update(updates, { transaction: t });

    let familiaresParsed = [];
    if (req.body && req.body.familiares) {
      if (typeof req.body.familiares === "string") {
        try {
          familiaresParsed = JSON.parse(req.body.familiares);
        } catch (e) {
          await t.rollback();
          return res.status(400).json({
            message: "O formato dos dados dos familiares é inválido.",
          });
        }
      } else if (Array.isArray(req.body.familiares)) {
        familiaresParsed = req.body.familiares;
      }
    }

    await manageFamiliares(req.user.id, familiaresParsed, t);

    await t.commit();

    const updatedMember = await db.LodgeMember.findByPk(req.user.id, {
      include: ["familiares"],
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      message: "Perfil atualizado com sucesso!",
      member: updatedMember.toJSON(),
    });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({
      message: "Erro ao atualizar perfil.",
      errorDetails: error.message,
    });
  }
};

// --- Funções de Admin/Diretoria ---

export const createLodgeMember = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    console.log("LOG: Request body in createLodgeMember:", req.body);
    const { familiares, SenhaHash, ...restOfMemberData } = req.body;

    const memberDataToCreate = {
      ...restOfMemberData,
      statusCadastro: "Aprovado",
    };

    if (!SenhaHash || SenhaHash.trim() === "") {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "A senha é obrigatória para criar um novo membro." });
    }
    memberDataToCreate.password = SenhaHash;

    if (memberDataToCreate.Email) {
      memberDataToCreate.Email = memberDataToCreate.Email.trim();
    }
    if (memberDataToCreate.CPF === "") {
      memberDataToCreate.CPF = null;
    }

    const dateFields = [
      "DataCasamento",
      "DataFiliacao",
      "DataRegularizacao",
      "DataIniciacao",
      "DataElevacao",
      "DataExaltacao",
      "DataNascimento",
    ];
    dateFields.forEach((field) => {
      if (
        memberDataToCreate[field] === "" ||
        memberDataToCreate[field] === "null"
      ) {
        memberDataToCreate[field] = null;
      }
    });

    const newMember = await db.LodgeMember.create(memberDataToCreate, {
      transaction: t,
    });

    let familiaresParsed = [];
    if (req.body.familiares) {
      if (typeof req.body.familiares === "string") {
        try {
          familiaresParsed = JSON.parse(req.body.familiares);
        } catch (e) {
          console.error("Failed to parse familiares string:", e);
          familiaresParsed = [];
        }
      } else if (Array.isArray(req.body.familiares)) {
        familiaresParsed = req.body.familiares;
      }
    }

    if (familiaresParsed && familiaresParsed.length > 0) {
      const familiaresData = familiaresParsed.map((f) => ({
        ...f,
        lodgeMemberId: newMember.id,
      }));
      await db.FamilyMember.bulkCreate(familiaresData, { transaction: t });
    }

    await t.commit();
    const { password: hashedPassword, ...memberResponse } = newMember.toJSON();
    res.status(201).json(memberResponse);
  } catch (error) {
    await t.rollback();
    console.error("Erro ao criar maçom (admin):", error);
    console.error("Full error object:", error);
    console.error("Request body:", req.body);
    if (error instanceof db.Sequelize.ValidationError) {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
      return res.status(400).json({
        message: "Erro de validação ao criar maçom.",
        errors: errors,
        stack: error.stack,
      });
    }

    res.status(500).json({
      message: "Erro ao criar maçom.",
      errorDetails: error.message,
      stack: error.stack,
    });
  }
};

export const getAllLodgeMembers = async (req, res) => {
  try {
    const { search, statusCadastro } = req.query;
    const whereClause = {};

    if (statusCadastro) {
      whereClause.statusCadastro = statusCadastro;
    }
    if (search) {
      const { Op } = db.Sequelize;
      whereClause[Op.or] = [
        { NomeCompleto: { [Op.like]: `%${search}%` } },
        { Email: { [Op.like]: `%${search}%` } },
        { CIM: { [Op.like]: `%${search}%` } },
      ];
    }

    const members = await db.LodgeMember.findAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [["NomeCompleto", "ASC"]],
      include: [
        {
          model: db.CargoExercido,
          as: "cargos",
          required: false,
        },
      ],
    });

    const membersWithCurrentCargo = members.map((member) => {
      const memberJson = member.toJSON();
      const currentCargo = memberJson.cargos.find((cargo) => {
        const dataInicio = new Date(cargo.dataInicio);
        const dataTermino = cargo.dataTermino
          ? new Date(cargo.dataTermino)
          : null;
        const now = new Date();

        return (
          dataInicio <= now && (dataTermino === null || dataTermino >= now)
        );
      });
      memberJson.cargoAtual = currentCargo ? currentCargo.nomeCargo : null;
      delete memberJson.cargos;
      return memberJson;
    });

    res.status(200).json(membersWithCurrentCargo);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar maçons.", errorDetails: error.message });
  }
};

export const getLodgeMemberById = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const member = await db.LodgeMember.findByPk(memberId, {
      attributes: { exclude: ["password"] },
      include: [{ model: db.FamilyMember, as: "familiares", required: false }],
    });
    if (!member)
      return res.status(404).json({ message: "Maçom não encontrado." });

    res.status(200).json(member.toJSON());
  } catch (error) {
    console.error("Erro ao buscar maçom por ID:", error);
    res.status(500).json({
      message: "Erro ao buscar maçom por ID.",
      errorDetails: error.message,
    });
  }
};

export const updateLodgeMemberById = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const memberId = parseInt(req.params.id, 10);
    const member = await db.LodgeMember.findByPk(memberId, { transaction: t });
    if (!member) {
      await t.rollback();
      return res.status(404).json({ message: "Maçom não encontrado." });
    }
    const allowedAdminFields = [
      "NomeCompleto",
      "Email",
      "CPF",
      "CIM",
      "Identidade",
      "DataNascimento",
      "DataCasamento",
      "Endereco_Rua",
      "Endereco_Numero",
      "Endereco_Bairro",
      "Endereco_Cidade",
      "Endereco_CEP",
      "Telefone",
      "Naturalidade",
      "Nacionalidade",
      "Religiao",
      "NomePai",
      "NomeMae",
      "FormacaoAcademica",
      "Ocupacao",
      "LocalTrabalho",
      "Situacao",
      "Graduacao",
      "DataIniciacao",
      "DataElevacao",
      "DataExaltacao",
      "DataFiliacao",
      "DataRegularizacao",
      "grauFilosofico",
      "password",
      "credencialAcesso",
      "statusCadastro",
      "FotoPessoal_Caminho",
    ];

    console.log("LOG: Request body in updateLodgeMemberById:", req.body);
    let memberUpdates = pick(req.body, allowedAdminFields);

    const dateFields = [
      "DataCasamento",
      "DataIniciacao",
      "DataElevacao",
      "DataExaltacao",
      "DataFiliacao",
      "DataRegularizacao",
      "DataNascimento",
    ];
    dateFields.forEach((field) => {
      if (memberUpdates[field] === "" || memberUpdates[field] === "null") {
        memberUpdates[field] = null;
      }
    });

    if (req.file) {
      memberUpdates.FotoPessoal_Caminho = path
        .join("uploads", "fotos_perfil", req.file.filename)
        .replace(/\\/g, "/");
    }

    let familiaresParsed = [];
    if (req.body && req.body.familiares) {
      if (typeof req.body.familiares === "string") {
        try {
          familiaresParsed = JSON.parse(req.body.familiares);
        } catch (e) {
          await t.rollback();
          return res.status(400).json({
            message: "O formato dos dados dos familiares é inválido.",
          });
        }
      } else if (Array.isArray(req.body.familiares)) {
        familiaresParsed = req.body.familiares;
      }
    }

    await member.update(memberUpdates, { transaction: t });

    await manageFamiliares(memberId, familiaresParsed, t);

    await t.commit();

    const updatedMember = await db.LodgeMember.findByPk(memberId, {
      include: ["familiares"],
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      message: "Maçom atualizado com sucesso!",
      member: updatedMember.toJSON(),
    });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar maçom por ID:", error);
    console.error("Full error object:", error);
    console.error("Request body:", req.body);
    res.status(500).json({
      message: "Erro interno no servidor ao atualizar maçom.",
      errorDetails: error.message,
      stack: error.stack,
    });
  }
};

export const deleteLodgeMemberById = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const member = await db.LodgeMember.findByPk(memberId);
    if (!member)
      return res.status(404).json({ message: "Maçom não encontrado." });

    await member.destroy();
    res.status(200).json({ message: "Maçom deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar maçom:", error);
    res
      .status(500)
      .json({ message: "Erro ao deletar maçom.", errorDetails: error.message });
  }
};
