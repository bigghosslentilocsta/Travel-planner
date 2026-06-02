import express from "express";
import { suggestItinerary } from "../controllers/ai.controller.js";
import { authRequired } from "../middleware/auth.js";

// Routes AI suggestion requests for a trip.
const router = express.Router({ mergeParams: true });

router.post("/itinerary", authRequired, suggestItinerary);

export default router;
