import express from "express";
import {
  getEscala,
  updateOrdemEscala,
  getProximoResponsavel,
} from "../controllers/escala.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getEscala);
router.put("/ordenar", protect, updateOrdemEscala);
router.get("/proximo-responsavel", protect, getProximoResponsavel);

export default router;
