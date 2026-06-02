import { Router } from "express";
import { createTrip, deleteTrip, inviteMember, joinTrip, listTrips } from "../controllers/trip.controller.js";
import { authRequired } from "../middleware/auth.js";

// Routes trip CRUD and membership actions.
const router = Router();

router.use(authRequired);
router.get("/", listTrips);
router.post("/", createTrip);
router.post("/join", joinTrip);
router.delete("/:tripId", deleteTrip);
router.post("/:tripId/invite", inviteMember);

export default router;
