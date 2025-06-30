// backend/routes/masonicsession.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import multer from "multer";

// 1. Importa todas as funções necessárias do controller
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  updateSessionAttendance,
  manageSessionVisitor,
  removeSessionVisitor,
  gerarBalaustreSessao,
} from "../controllers/masonicsession.controller.js";

// 2. Importa todos os validadores necessários
import {
  validateSessionCreation,
  validateSessionUpdate,
  validateAttendanceUpdate,
  sessionIdParamRule,
} from "../validators/masonicsession.validator.js";

const router = express.Router();
const upload = multer();

// Aplica autenticação a todas as rotas deste ficheiro
router.use(authMiddleware);

// --- ROTAS PARA SESSÕES (CRUD) ---

router.get("/", authorizeByFeature("visualizarSessoes"), getAllSessions);

router.post(
  "/",
  authorizeByFeature("criarNovaSessao"),
  upload.none(), // Adiciona o middleware do Multer para lidar com multipart/form-data
  validateSessionCreation,
  createSession
);

router.get(
  "/:id",
  authorizeByFeature("visualizarDetalhesSessao"),
  sessionIdParamRule,
  getSessionById
);

router.put(
  "/:id",
  authorizeByFeature("editarSessao"),
  sessionIdParamRule,
  validateSessionUpdate,
  updateSession
);

router.delete(
  "/:id",
  authorizeByFeature("deletarSessao"),
  sessionIdParamRule,
  deleteSession
);

// --- ROTAS PARA GESTÃO DE PRESENÇA E VISITANTES ---

router.put(
  "/:id/attendance",
  authorizeByFeature("gerenciarPresenca"),
  sessionIdParamRule,
  validateAttendanceUpdate,
  updateSessionAttendance
);

router.post(
  "/:id/visitors",
  authorizeByFeature("gerenciarVisitantes"),
  sessionIdParamRule,
  manageSessionVisitor
);

router.delete(
  "/visitors/:visitorId",
  authorizeByFeature("gerenciarVisitantes"),
  // Adicionar validador para visitorId se necessário
  removeSessionVisitor
);

// --- ROTAS PARA DOCUMENTOS DA SESSÃO ---

router.post(
  "/:id/gerar-balaustre",
  authorizeByFeature("gerarBalaustre"),
  sessionIdParamRule,
  gerarBalaustreSessao
);

// 3. Garante a exportação padrão do router
export default router;
