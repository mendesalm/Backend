import express from 'express';
import documentoGeradoController from '../controllers/documentoGerado.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';

const router = express.Router();

const pranchaPermissions = ["Venerável Mestre", "Secretário", "Secretário Adjunto"];
const conviteCartaoPermissions = ["Venerável Mestre", "Chanceler", "Chanceler Adjunto"];

router.post(
    '/prancha',
    authMiddleware,
    authorizeByFeature(pranchaPermissions),
    (req, res) => documentoGeradoController.gerarDocumento(Object.assign(req, { params: { tipo: 'Prancha' } }), res)
);

router.post(
    '/convite',
    authMiddleware,
    authorizeByFeature(conviteCartaoPermissions),
    (req, res) => documentoGeradoController.gerarDocumento(Object.assign(req, { params: { tipo: 'Convite' } }), res)
);

router.post(
    '/cartao',
    authMiddleware,
    authorizeByFeature(conviteCartaoPermissions),
    (req, res) => documentoGeradoController.gerarDocumento(Object.assign(req, { params: { tipo: 'Cartão' } }), res)
);

router.get('/', authMiddleware, documentoGeradoController.getDocumentos);
router.get('/:id', authMiddleware, documentoGeradoController.getDocumentoById);

export default router;