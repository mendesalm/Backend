import db from "../models/index.js";
import { pick } from "../utils/pick.js";

// Função auxiliar para gerir familiares numa transação
const manageFamiliares = async (lodgeMemberId, familiaresData, transaction) => {
  console.log("[UPDATE-DEBUG] Iniciando manageFamiliares...");
  if (!familiaresData || !Array.isArray(familiaresData)) {
    console.log(
      "[UPDATE-DEBUG] Nenhum dado de familiares válido para processar."
    );
    return;
  }

  const existingFamiliares = await db.FamilyMember.findAll({
    where: { lodgeMemberId },
    transaction,
  });

  const incomingIds = new Set(
    familiaresData.filter((f) => f.id).map((f) => f.id)
  );
  console.log(
    "[UPDATE-DEBUG] IDs de familiares recebidos:",
    Array.from(incomingIds)
  );

  // Deleta familiares que foram removidos no formulário
  for (const existing of existingFamiliares) {
    if (!incomingIds.has(existing.id)) {
      console.log(`[UPDATE-DEBUG] A deletar familiar com ID: ${existing.id}`);
      await existing.destroy({ transaction });
    }
  }

  // Cria ou atualiza os familiares da lista
  for (const familiarData of familiaresData) {
    const data = { ...familiarData, lodgeMemberId };
    if (familiarData.id) {
      console.log(
        `[UPDATE-DEBUG] A atualizar familiar com ID: ${familiarData.id}`
      );
      const familiar = await db.FamilyMember.findByPk(familiarData.id, {
        transaction,
      });
      if (familiar) {
        await familiar.update(data, { transaction });
      }
    } else {
      console.log("[UPDATE-DEBUG] A criar novo familiar:", data);
      await db.FamilyMember.create(data, { transaction });
    }
  }
  console.log("[UPDATE-DEBUG] manageFamiliares concluído.");
};

// Obter o perfil do maçom autenticado
export const getMyProfile = async (req, res) => {
  try {
    const member = await db.LodgeMember.findByPk(req.user.id, {
      attributes: {
        exclude: ["SenhaHash", "resetPasswordToken", "resetPasswordExpires"],
      },
      include: [
        { model: db.FamilyMember, as: "familiares", required: false },
        {
          model: db.CargoExercido,
          as: "cargos",
          order: [["dataInicio", "DESC"]],
          required: false,
        },
      ],
    });
    if (!member)
      return res.status(404).json({ message: "Maçom não encontrado." });
    res.status(200).json(member);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar dados do perfil.",
        errorDetails: error.message,
      });
  }
};

// Atualizar o perfil do maçom autenticado
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
    ];
    const updates = pick(req.body, allowedFields);
    await member.update(updates, { transaction: t });

    await manageFamiliares(req.user.id, req.body.familiares, t);

    await t.commit();

    const updatedMember = await db.LodgeMember.findByPk(req.user.id, {
      include: ["familiares"],
    });
    const {
      SenhaHash,
      resetPasswordToken,
      resetPasswordExpires,
      ...memberResponse
    } = updatedMember.toJSON();
    res
      .status(200)
      .json({
        message: "Perfil atualizado com sucesso!",
        member: memberResponse,
      });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar perfil:", error);
    res
      .status(500)
      .json({
        message: "Erro ao atualizar perfil.",
        errorDetails: error.message,
      });
  }
};

// --- Funções de Admin/Diretoria ---

export const createLodgeMember = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { familiares, ...memberData } = req.body;
    const newMember = await db.LodgeMember.create(
      { ...memberData, statusCadastro: "Aprovado" },
      { transaction: t }
    );

    if (familiares && familiares.length > 0) {
      const familiaresData = familiares.map((f) => ({
        ...f,
        lodgeMemberId: newMember.id,
      }));
      await db.FamilyMember.bulkCreate(familiaresData, { transaction: t });
    }

    await t.commit();
    const { SenhaHash, ...memberResponse } = newMember.toJSON();
    res.status(201).json(memberResponse);
  } catch (error) {
    await t.rollback();
    console.error("Erro ao criar maçom (admin):", error);
    res
      .status(500)
      .json({ message: "Erro ao criar maçom.", errorDetails: error.message });
  }
};

export const getAllLodgeMembers = async (req, res) => {
  try {
    const members = await db.LodgeMember.findAll({
      attributes: { exclude: ["SenhaHash"] },
      order: [["NomeCompleto", "ASC"]],
    });
    res.status(200).json(members);
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
      attributes: { exclude: ["SenhaHash"] },
      include: [
        { model: db.FamilyMember, as: "familiares", required: false },
        {
          model: db.CargoExercido,
          as: "cargos",
          required: false,
          order: [["dataInicio", "DESC"]],
        },
      ],
    });
    if (!member)
      return res.status(404).json({ message: "Maçom não encontrado." });
    res.status(200).json(member);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar maçom por ID.",
        errorDetails: error.message,
      });
  }
};

// --- FUNÇÃO ATUALIZADA COM LOGS DE DEPURAÇÃO ---
export const updateLodgeMemberById = async (req, res) => {
  console.log(
    `\n[UPDATE-DEBUG] ----- INICIANDO ATUALIZAÇÃO PARA O MEMBRO ID: ${req.params.id} -----`
  );
  const t = await db.sequelize.transaction();
  try {
    const memberId = parseInt(req.params.id, 10);
    console.log(
      "[UPDATE-DEBUG] Corpo da requisição recebido:",
      JSON.stringify(req.body, null, 2)
    );

    const member = await db.LodgeMember.findByPk(memberId, { transaction: t });
    if (!member) {
      await t.rollback();
      console.log(
        "[UPDATE-DEBUG] ERRO: Membro não encontrado. Rollback executado."
      );
      return res.status(404).json({ message: "Maçom não encontrado." });
    }
    console.log("[UPDATE-DEBUG] Membro encontrado no banco de dados.");

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
      "credencialAcesso",
      "statusCadastro",
    ];
    const memberUpdates = pick(req.body, allowedAdminFields);

    console.log(
      "[UPDATE-DEBUG] Campos do membro a serem atualizados:",
      memberUpdates
    );
    await member.update(memberUpdates, { transaction: t });
    console.log("[UPDATE-DEBUG] Dados do membro principal atualizados.");

    await manageFamiliares(memberId, req.body.familiares, t);

    console.log("[UPDATE-DEBUG] A executar commit da transação...");
    await t.commit();
    console.log(
      "[UPDATE-DEBUG] Transação confirmada com sucesso (commit executado)."
    );

    const updatedMember = await db.LodgeMember.findByPk(memberId, {
      include: ["familiares"],
    });
    const { SenhaHash, ...memberResponse } = updatedMember.toJSON();
    res
      .status(200)
      .json({
        message: "Maçom atualizado com sucesso!",
        member: memberResponse,
      });
  } catch (error) {
    await t.rollback();
    console.error(
      "\n[UPDATE-DEBUG] OCORREU UM ERRO! Rollback executado. Detalhes do erro:",
      error
    );

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const errors = error.errors.map((e) => ({
        campo: e.path,
        mensagem: e.message,
      }));
      return res
        .status(400)
        .json({ message: "Erro de validação nos dados fornecidos.", errors });
    }

    res
      .status(500)
      .json({
        message: "Erro interno no servidor ao atualizar maçom.",
        errorDetails: error.message,
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
    res
      .status(500)
      .json({ message: "Erro ao deletar maçom.", errorDetails: error.message });
  }
};
