// backend/controllers/familymember.controller.js
import db from '../models/index.js';

// Criar um novo familiar para o maçom autenticado
export const createFamilyMember = async (req, res) => {
  const { nomeCompleto, parentesco, dataNascimento, email, telefone } = req.body;
  const lodgeMemberId = req.user.id; // ID do LodgeMember autenticado

  try {
    if (!db.FamilyMember || !db.LodgeMember) {
      console.error("[createFamilyMember] Modelos não inicializados.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelos não inicializados." });
    }

    // Verificar se o LodgeMember (usuário pai) existe
    const member = await db.LodgeMember.findByPk(lodgeMemberId);
    if (!member) {
      return res.status(404).json({ message: `Maçom (proprietário do familiar) com ID ${lodgeMemberId} não encontrado.` });
    }

    const newFamilyMember = await db.FamilyMember.create({
      nomeCompleto,
      parentesco,
      dataNascimento,
      email: email || null, // Garante null se vazio
      telefone: telefone || null, // Garante null se vazio
      lodgeMemberId: parseInt(lodgeMemberId, 10),
    });

    res.status(201).json(newFamilyMember);
  } catch (error) {
    console.error("Erro ao criar familiar:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Erro de validação ou duplicidade.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro no servidor ao criar familiar.', errorDetails: error.message });
  }
};

// Listar todos os familiares do maçom autenticado
export const getFamilyMembersForCurrentUser = async (req, res) => {
  const lodgeMemberId = req.user.id;
  try {
    if (!db.FamilyMember) {
      console.error("[getFamilyMembersForCurrentUser] Modelo FamilyMember não inicializado.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo não inicializado." });
    }
    const familyMembers = await db.FamilyMember.findAll({
      where: { lodgeMemberId: parseInt(lodgeMemberId, 10) },
      order: [['nomeCompleto', 'ASC']], // Exemplo de ordenação
    });
    res.status(200).json(familyMembers);
  } catch (error) {
    console.error("Erro ao buscar familiares:", error);
    res.status(500).json({ message: 'Erro ao buscar familiares.', errorDetails: error.message });
  }
};

// Obter um familiar específico por ID (do maçom logado)
export const getFamilyMemberById = async (req, res) => {
  const { id } = req.params; // ID do familiar
  const lodgeMemberId = req.user.id; // ID do maçom logado
  try {
    if (!db.FamilyMember) {
      console.error("[getFamilyMemberById] Modelo FamilyMember não inicializado.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo não inicializado." });
    }
    const familyMemberId = parseInt(id, 10);
    if (isNaN(familyMemberId)) return res.status(400).json({ message: 'ID do familiar inválido.' });

    const familyMember = await db.FamilyMember.findOne({
      where: { id: familyMemberId, lodgeMemberId: parseInt(lodgeMemberId, 10) }
    });
    if (!familyMember) {
      return res.status(404).json({ message: 'Familiar não encontrado ou não pertence a este maçom.' });
    }
    res.status(200).json(familyMember);
  } catch (error) {
    console.error("Erro ao buscar familiar por ID:", error);
    res.status(500).json({ message: 'Erro ao buscar familiar por ID.', errorDetails: error.message });
  }
};

// Atualizar um familiar específico (do maçom logado)
export const updateFamilyMember = async (req, res) => {
  const { id } = req.params; // ID do familiar
  const lodgeMemberId = req.user.id;
  const { nomeCompleto, parentesco, dataNascimento, email, telefone } = req.body;

  try {
    if (!db.FamilyMember) {
      console.error("[updateFamilyMember] Modelo FamilyMember não inicializado.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo não inicializado." });
    }
    const familyMemberId = parseInt(id, 10);
    if (isNaN(familyMemberId)) return res.status(400).json({ message: 'ID do familiar inválido.' });

    const familyMember = await db.FamilyMember.findOne({
      where: { id: familyMemberId, lodgeMemberId: parseInt(lodgeMemberId, 10) }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Familiar não encontrado ou não pertence a este maçom para atualização.' });
    }

    const updates = {};
    if (nomeCompleto !== undefined) updates.nomeCompleto = nomeCompleto;
    if (parentesco !== undefined) updates.parentesco = parentesco;
    if (dataNascimento !== undefined) updates.dataNascimento = dataNascimento;
    // Para campos opcionais, permitir que sejam definidos como null para limpar o valor
    updates.email = email !== undefined ? (email === '' ? null : email) : familyMember.email;
    updates.telefone = telefone !== undefined ? (telefone === '' ? null : telefone) : familyMember.telefone;
    
    // Remove chaves com valor undefined para não sobrescrever desnecessariamente
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);


    if (Object.keys(updates).length === 0) {
        return res.status(200).json({ message: "Nenhum dado válido fornecido para atualização.", familyMember });
    }

    await familyMember.update(updates);
    res.status(200).json(familyMember);
  } catch (error) {
    console.error("Erro ao atualizar familiar:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Erro de validação ou duplicidade.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro no servidor ao atualizar familiar.', errorDetails: error.message });
  }
};

// Deletar um familiar específico (do maçom logado)
export const deleteFamilyMember = async (req, res) => {
  const { id } = req.params; // ID do familiar
  const lodgeMemberId = req.user.id;

  try {
    if (!db.FamilyMember) {
      console.error("[deleteFamilyMember] Modelo FamilyMember não inicializado.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo não inicializado." });
    }
    const familyMemberId = parseInt(id, 10);
    if (isNaN(familyMemberId)) return res.status(400).json({ message: 'ID do familiar inválido.' });

    const familyMember = await db.FamilyMember.findOne({
      where: { id: familyMemberId, lodgeMemberId: parseInt(lodgeMemberId, 10) }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Familiar não encontrado ou não pertence a este maçom para exclusão.' });
    }
    
    await familyMember.destroy();
    res.status(200).json({ message: 'Familiar deletado com sucesso.' });
  } catch (error) {
    console.error("Erro ao deletar familiar:", error);
    res.status(500).json({ message: 'Erro ao deletar familiar.', errorDetails: error.message });
  }
};