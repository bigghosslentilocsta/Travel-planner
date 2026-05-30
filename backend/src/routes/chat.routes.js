import express from "express";
import { listMessages, postMessage } from "../controllers/chat.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.get("/", authRequired, listMessages);
router.post("/", authRequired, postMessage);

export default router;
