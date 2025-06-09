// routes/reserva.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as reservaController from '../controllers/reserva.controller.js';

const router = express.Router({ mergeParams: true }); // Para aceder a :livroId
router.use(authMiddleware);

router.post('/',
  authorizeByFeature('criarReservaLivro'),
  reservaController.createReserva
);

export default router;
