import express from "express";
import { setNumber } from "../controllers/numbering.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

const router = express.Router();

// Apply authentication to all routes in this file
router.use(authMiddleware);

// Route to set a counter's number
router.post("/set-number", authorizeByFeature("manageCounters"), setNumber);

export default router;