// controllers/menu_item.controller.js
import db from '../models/index.js';

export const createMenuItem = async (req, res) => {
  try {
    const menuItem = await db.MenuItem.create(req.body);
    res.status(201).json(menuItem);
  } catch (error) { res.status(500).json({ message: 'Erro ao criar item de menu.', errorDetails: error.message }); }
};

export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await db.MenuItem.findAll({ order: [['ordem', 'ASC']] });
    res.status(200).json(menuItems);
  } catch (error) { res.status(500).json({ message: 'Erro ao listar itens de menu.', errorDetails: error.message }); }
};

export const updateMenuItem = async (req, res) => {
  try {
    const [updated] = await db.MenuItem.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: 'Item de menu não encontrado.' });
    const updatedItem = await db.MenuItem.findByPk(req.params.id);
    res.status(200).json(updatedItem);
  } catch (error) { res.status(500).json({ message: 'Erro ao atualizar item de menu.', errorDetails: error.message }); }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const deleted = await db.MenuItem.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Item de menu não encontrado.' });
    res.status(204).send();
  } catch (error) { res.status(500).json({ message: 'Erro ao deletar item de menu.', errorDetails: error.message }); }
};
