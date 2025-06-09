import db from '../models/index.js';
import { pick } from '../utils/pick.js';

// Obter o perfil do maçom autenticado
export const getMyProfile = async (req, res) => {
  try {
    const member = await db.LodgeMember.findByPk(req.user.id, {
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        { model: db.FamilyMember, as: 'familiares', required: false },
        { model: db.CargoExercido, as: 'cargos', order: [['dataInicio', 'DESC']], required: false }
      ]
    });
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    res.status(200).json(member);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do perfil.', errorDetails: error.message });
  }
};

// Atualizar o perfil do maçom autenticado
export const updateMyProfile = async (req, res) => {
  try {
    const member = await db.LodgeMember.findByPk(req.user.id);
    if (!member) {
      return res.status(404).json({ message: 'Maçom não encontrado.' });
    }
    const allowedFields = [
      'NomeCompleto', 'CIM', 'Identidade', 'Email', 'FotoPessoal_Caminho', 'DataNascimento', 
      'DataCasamento', 'Endereco_Rua', 'Endereco_Numero', 'Endereco_Bairro', 'Endereco_Cidade', 
      'Endereco_CEP', 'Telefone', 'Naturalidade', 'Nacionalidade', 'Religiao', 'NomePai', 'NomeMae',
      'FormacaoAcademica', 'Ocupacao', 'LocalTrabalho', 'grauFilosofico'
    ];
    const updates = pick(req.body, allowedFields);
    await member.update(updates);
    const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...memberResponse } = member.toJSON();
    res.status(200).json({ message: 'Perfil atualizado com sucesso!', member: memberResponse });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: 'Erro ao atualizar perfil.', errorDetails: error.message });
  }
};

// --- Funções de Admin/Diretoria ---

export const createLodgeMember = async (req, res) => {
  try {
    const newMember = await db.LodgeMember.create({ ...req.body, statusCadastro: 'Aprovado' });
    const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...memberResponse } = newMember.toJSON();
    res.status(201).json(memberResponse);
  } catch (error) {
    console.error("Erro ao criar maçom (admin):", error);
    res.status(500).json({ message: 'Erro ao criar maçom.', errorDetails: error.message });
  }
};

export const getAllLodgeMembers = async (req, res) => {
  try {
    const members = await db.LodgeMember.findAll({
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [ { model: db.CargoExercido, as: 'cargos', attributes: ['nomeCargo', 'dataInicio', 'dataTermino'], required: false } ],
      order: [['NomeCompleto', 'ASC']]
    });
    res.status(200).json(members);
  } catch (error) {
    console.error("Erro ao listar maçons:", error);
    res.status(500).json({ message: 'Erro ao listar maçons.', errorDetails: error.message });
  }
};

export const getLodgeMemberById = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });
    const member = await db.LodgeMember.findByPk(memberId, {
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        { model: db.FamilyMember, as: 'familiares', required: false },
        { model: db.CargoExercido, as: 'cargos', required: false, order: [['dataInicio', 'DESC']] }
      ]
    });
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    res.status(200).json(member);
  } catch (error) {
    console.error("Erro ao buscar maçom por ID:", error);
    res.status(500).json({ message: 'Erro ao buscar maçom por ID.', errorDetails: error.message });
  }
};

export const updateLodgeMemberById = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });

    const member = await db.LodgeMember.findByPk(memberId);
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });

    // Lista de todos os campos que um administrador pode editar.
    const allowedAdminFields = [
      'NomeCompleto', 'Email', 'CPF', 'CIM', 'Identidade', 'FotoPessoal_Caminho', 
      'DataNascimento', 'DataCasamento', 'Endereco_Rua', 'Endereco_Numero', 
      'Endereco_Bairro', 'Endereco_Cidade', 'Endereco_CEP', 'Telefone', 
      'Naturalidade', 'Nacionalidade', 'Religiao', 'NomePai', 'NomeMae', 
      'FormacaoAcademica', 'Ocupacao', 'LocalTrabalho', 'Situacao', 'Graduacao', 
      'DataIniciacao', 'DataElevacao', 'DataExaltacao', 'DataFiliacao', 
      'DataRegularizacao', 'grauFilosofico', 'credencialAcesso', 'Funcao',
      'statusCadastro'
    ];

    // --- LOGS DE DEPURAÇÃO ADICIONADOS ---
    console.log('[DEBUG] Corpo da Requisição (req.body):', req.body);
    const updates = pick(req.body, allowedAdminFields);
    console.log('[DEBUG] Dados a serem atualizados (updates):', updates);
    // --- FIM DOS LOGS DE DEPURAÇÃO ---
    
    // Verifica se há algo para atualizar
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Nenhum campo válido para atualização foi fornecido.' });
    }

    await member.update(updates);
    const { SenhaHash: removedPass, ...memberResponse } = member.toJSON();
    res.status(200).json({ message: 'Maçom atualizado com sucesso!', member: memberResponse });
    
  } catch (error) {
    console.error("Erro ao atualizar maçom por ID (admin):", error);
    res.status(500).json({ message: 'Erro ao atualizar maçom.', errorDetails: error.message });
  }
};

export const deleteLodgeMemberById = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });
    const member = await db.LodgeMember.findByPk(memberId);
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    await member.destroy();
    res.status(200).json({ message: 'Maçom deletado com sucesso.' });
  } catch (error) {
    console.error("Erro ao deletar maçom:", error);
    res.status(500).json({ message: 'Erro ao deletar maçom.', errorDetails: error.message });
  }
};
