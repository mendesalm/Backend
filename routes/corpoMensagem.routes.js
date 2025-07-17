import express from 'express';
const router = express.Router();
import authMiddleware from '../middlewares/auth.middleware.js';
import corpoMensagemController from '../controllers/corpoMensagem.controller.js';

// Rotas para o CRUD de Corpos de Mensagens
router.post('/', authMiddleware, corpoMensagemController.create);
router.get('/', authMiddleware, corpoMensagemController.findAll);
router.put('/:id', authMiddleware, corpoMensagemController.update);
router.delete('/:id', authMiddleware, corpoMensagemController.remove);

export default router;