// routes/foto_evento.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as fotoController from '../controllers/foto_evento.controller.js';
import { uploadFotosEvento } from '../middlewares/upload.middleware.js';

const router = express.Router({ mergeParams: true }); // Para aceder a :eventoId
router.use(authMiddleware);

// A rota de GET das fotos fará parte de GET /api/eventos/:id

router.post('/',
  authorizeByFeature('uploadFotoEvento'),
  uploadFotosEvento.array('fotos', 10), // Permite até 10 fotos de uma vez
  fotoController.uploadFotos
);

router.delete('/:fotoId',
  authorizeByFeature('deletarFotoEvento'),
  fotoController.deleteFoto
);

export default router;
