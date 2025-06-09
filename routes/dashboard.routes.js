// routes/dashboard.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Protege a rota com autenticação e a permissão que criámos
router.get('/',
  authMiddleware,
  authorizeByFeature('acessarDashboard'),
  dashboardController.getDashboardData
);

export default router;