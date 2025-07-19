import express from "express";
import {
  assinarEdital,
} from "../controllers/edital.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post(
  "/:id/assinar",
  authorizeByFeature("assinarDocumentos"),
  assinarEdital
);

export default router;