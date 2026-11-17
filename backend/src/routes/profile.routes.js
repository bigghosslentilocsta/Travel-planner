import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.use(authRequired);
router.get("/", getProfile);
router.patch("/", updateProfile);

export default router;
