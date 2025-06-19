import express from "express";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import * as visitorController from "../controllers/visitantesessao.controller.js";
import {
  visitorRules,
  visitorIdParamRule,
  handleValidationErrors,
} from "../validators/visitantesessao.validator.js";

const router = express.Router({ mergeParams: true });

const canViewVisitors = authorizeByFeature("visualizarVisitantesSessao");
const canManageVisitors = authorizeByFeature("gerenciarVisitantesSessao");

router.get("/", canViewVisitors, visitorController.getAllVisitorsForSession);
router.post(
  "/",
  canManageVisitors,
  visitorRules,
  handleValidationErrors,
  visitorController.createVisitor
);
router.put(
  "/:visitorId",
  canManageVisitors,
  visitorIdParamRule,
  visitorRules,
  handleValidationErrors,
  visitorController.updateVisitor
);
router.delete(
  "/:visitorId",
  canManageVisitors,
  visitorIdParamRule,
  handleValidationErrors,
  visitorController.deleteVisitor
);

export default router;
