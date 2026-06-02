import { Router } from "express";
import { firebaseAuth, login, signup } from "../controllers/auth.controller.js";

// Exposes auth endpoints for signup, login, and Firebase exchange.
const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/firebase", firebaseAuth);

export default router;
