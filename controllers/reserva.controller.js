// controllers/reserva.controller.js
import db from '../models/index.js';
// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Criar uma nova reserva para um livro
export const createReserva = async (req, res) => {
    const { livroId } = req.params;
    const membroId = req.user.id;
    try {
        const livro = await db.Biblioteca.findByPk(livroId); // Usa db.Biblioteca
        if (!livro) return res.status(404).json({ message: 'Livro não encontrado.' });
        if (livro.status !== 'Emprestado') return res.status(409).json({ message: 'Este livro não está emprestado e não pode ser reservado. Verifique se ele está disponível.' });
        
        const reservaExistente = await db.Reserva.findOne({ where: { livroId, membroId, status: 'Ativa' } }); // Usa db.Reserva
        if(reservaExistente) return res.status(409).json({ message: 'Você já possui uma reserva ativa para este livro.' });

        const novaReserva = await db.Reserva.create({ livroId, membroId }); // Usa db.Reserva
        res.status(201).json(novaReserva);
    } catch (error) { res.status(500).json({ message: 'Erro ao criar reserva.', errorDetails: error.message }); }
};

// ... (adicionar outras funções como cancelarReserva, listarMinhasReservas, etc.)