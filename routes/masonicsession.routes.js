import express from "express";
import * as masonicSessionController from "../controllers/masonicsession.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import { uploadAta } from "../middlewares/upload.middleware.js";
import {
  sessionRules,
  sessionIdParamRule,
  setAttendeesRules,
  handleValidationErrors,
} from "../validators/masonicsession.validator.js";
import visitorRoutes from "./visitantesessao.routes.js";

const router = express.Router();

router.use(authMiddleware);

// CRUD da Sessão Principal
router.post(
  "/",
  authorizeByFeature("criarSessaoMaconica"),
  uploadAta.single("ataFile"),
  sessionRules(false),
  handleValidationErrors,
  masonicSessionController.createSession
);
router.get(
  "/",
  authorizeByFeature("listarSessoes"),
  masonicSessionController.getAllSessions
);
router.get(
  "/:id",
  authorizeByFeature("visualizarDetalhesSessaoMaconica"),
  sessionIdParamRule(),
  handleValidationErrors,
  masonicSessionController.getSessionById
);
router.put(
  "/:id",
  authorizeByFeature("editarSessaoMaconica"),
  uploadAta.single("ataFile"),
  sessionIdParamRule(),
  sessionRules(true),
  handleValidationErrors,
  masonicSessionController.updateSession
);
router.delete(
  "/:id",
  authorizeByFeature("deletarSessaoMaconica"),
  sessionIdParamRule(),
  handleValidationErrors,
  masonicSessionController.deleteSession
);

// Rotas Aninhadas
router.use("/:id/visitors", visitorRoutes);
router.get(
  "/:id/attendees",
  authorizeByFeature("visualizarPresentesSessao"),
  sessionIdParamRule(),
  handleValidationErrors,
  masonicSessionController.getSessionAttendees
);
router.post(
  "/:id/attendees",
  authorizeByFeature("gerenciarPresentesSessao"),
  sessionIdParamRule(),
  setAttendeesRules,
  handleValidationErrors,
  masonicSessionController.setSessionAttendees
);
router.get(
  "/:id/painel-chanceler",
  authorizeByFeature("visualizarPainelChanceler"),
  masonicSessionController.getPainelChanceler
);

export default router;
