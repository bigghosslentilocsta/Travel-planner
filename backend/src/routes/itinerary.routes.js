import { Router } from "express";
import { addActivity, deleteActivity, getItineraryByTrip, reorderActivities } from "../controllers/itinerary.controller.js";
import { authRequired } from "../middleware/auth.js";

// Routes itinerary reads and writes for one trip.
const router = Router({ mergeParams: true });

router.use(authRequired);
router.get("/", getItineraryByTrip);
router.post("/day/:dayNumber/activities", addActivity);
router.delete("/day/:dayNumber/activities/:activityId", deleteActivity);
router.put("/day/:dayNumber/reorder", reorderActivities);

export default router;
