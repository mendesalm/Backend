// controllers/aviso.controller.js
import db from '../models/index.js';
// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.
// Em vez de: const { Aviso, LodgeMember, Sequelize } = db;
// Vamos aceder aos modelos através de `db.ModelName` dentro de cada função.

// Criar um novo aviso
export const createAviso = async (req, res) => {
  const { titulo, conteudo, dataExpiracao, fixado } = req.body;
  const autorId = req.user.id;
  try {
    // Acedemos ao modelo Aviso através do objeto db importado
   const novoAviso = await db.Aviso.create({
    titulo, conteudo, autorId, fixado,
     dataExpiracao: dataExpiracao || null,
   });
   res.status(201).json(novoAviso);
  } catch (error) { res.status(500).json({ message: 'Erro ao criar aviso.', errorDetails: error.message }); }
};

// Listar todos os avisos (não expirados), com os fixados primeiro
export const getAllAvisos = async (req, res) => {
  try {
    const { Op } = db.Sequelize; // Obtém o Op aqui dentro
   const hoje = new Date().toISOString().slice(0, 10);

    // CORREÇÃO: Usamos `db.Aviso` e `db.LodgeMember` para garantir que os modelos estão inicializados.
   const avisos = await db.Aviso.findAll({
    where: {
        [Op.or]: [
          { dataExpiracao: { [Op.gte]: hoje } },
          { dataExpiracao: null }
        ]
      },
      include: [{ model: db.LodgeMember, as: 'autor', attributes: ['NomeCompleto'] }],
      order: [['fixado', 'DESC'], ['createdAt', 'DESC']],
    });
    res.status(200).json(avisos);
  } catch (error) {
    console.error("DEBUG: Erro em getAllAvisos:", error); // Adicionado log para debug
    res.status(500).json({ message: 'Erro ao listar avisos.', errorDetails: error.message });
  }
};

// Obter um aviso por ID
export const getAvisoById = async (req, res) => {
  try {
    const aviso = await db.Aviso.findByPk(req.params.id, {
      include: [{ model: db.LodgeMember, as: 'autor', attributes: ['NomeCompleto'] }]
    });
    if (!aviso) return res.status(404).json({ message: 'Aviso não encontrado.' });
    res.status(200).json(aviso);
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar aviso.', errorDetails: error.message }); }
};

// Atualizar um aviso
export const updateAviso = async (req, res) => {
  try {
    const [updated] = await db.Aviso.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: 'Aviso não encontrado.' });
    const updatedAviso = await db.Aviso.findByPk(req.params.id);
    res.status(200).json(updatedAviso);
  } catch (error) { res.status(500).json({ message: 'Erro ao atualizar aviso.', errorDetails: error.message }); }
};

// Deletar um aviso
export const deleteAviso = async (req, res) => {
  try {
    const deleted = await db.Aviso.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Aviso não encontrado.' });
    res.status(204).send();
  } catch (error) { res.status(500).json({ message: 'Erro ao deletar aviso.', errorDetails: error.message }); }
};
