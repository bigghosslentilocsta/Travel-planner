import { Router } from "express";
import {
  createInviteLink,
  createTrip,
  deleteTrip,
  exitTrip,
  inviteMember,
  joinTrip,
  joinTripByInvite,
  listTrips
} from "../controllers/trip.controller.js";
import { authRequired } from "../middleware/auth.js";

// Routes trip CRUD and membership actions.
const router = Router();

router.post("/invite/:inviteToken/join", authRequired, joinTripByInvite);
router.use(authRequired);
router.get("/", listTrips);
router.post("/", createTrip);
router.post("/join", joinTrip);
router.post("/:tripId/invite-link", createInviteLink);
router.post("/:tripId/exit", exitTrip);
router.delete("/:tripId", deleteTrip);
router.post("/:tripId/invite", inviteMember);

export default router;
