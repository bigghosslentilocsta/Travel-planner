import { z } from "zod";
import { Itinerary } from "../models/Itinerary.js";
import { Trip } from "../models/Trip.js";

// Reads and updates itinerary items for a trip.
const activitySchema = z.object({
  time: z.string().min(1),
  activityName: z.string().min(2).max(200),
  location: z.string().max(150).optional().default(""),
  estimatedCost: z.number().min(0).default(0)
});

const reorderSchema = z.object({
  activityIds: z.array(z.string()).min(1)
});

const deleteActivitySchema = z.object({
  activityId: z.string().min(1)
});

// Confirms the caller is a member of the target trip.
async function verifyMembership(tripId, userId) {
  const trip = await Trip.findById(tripId).select("members");
  if (!trip) return false;
  return trip.members.some((member) => member.toString() === userId);
}

// Returns the itinerary grouped by day for one trip.
export async function getItineraryByTrip(req, res, next) {
  try {
    const { tripId } = req.params;
    const hasAccess = await verifyMembership(tripId, req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const itinerary = await Itinerary.find({ trip: tripId }).sort({ dayNumber: 1 }).lean();
    return res.json({ itinerary });
  } catch (error) {
    return next(error);
  }
}

// Adds a new activity to the requested day.
export async function addActivity(req, res, next) {
  try {
    const { tripId, dayNumber } = req.params;
    const hasAccess = await verifyMembership(tripId, req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const input = activitySchema.parse(req.body);
    const dayNum = Number(dayNumber);

    let itinerary = await Itinerary.findOne({ trip: tripId, dayNumber: dayNum });
    if (!itinerary) {
      itinerary = await Itinerary.create({ trip: tripId, dayNumber: dayNum, activities: [] });
    }

    itinerary.activities.push({
      ...input,
      position: itinerary.activities.length,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    await itinerary.save();

    req.app.get("io").to(`trip:${tripId}`).emit("itinerary:updated", {
      tripId,
      dayNumber: dayNum,
      activities: itinerary.activities
    });

    return res.status(201).json({ itinerary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Reorders activities within a day based on the provided ids.
export async function reorderActivities(req, res, next) {
  try {
    const { tripId, dayNumber } = req.params;
    const hasAccess = await verifyMembership(tripId, req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const input = reorderSchema.parse(req.body);

    const itinerary = await Itinerary.findOne({ trip: tripId, dayNumber: Number(dayNumber) });
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary day not found" });
    }

    const activityMap = new Map(itinerary.activities.map((activity) => [activity._id.toString(), activity]));

    itinerary.activities = input.activityIds
      .map((id, index) => {
        const activity = activityMap.get(id);
        if (!activity) {
          return null;
        }
        activity.position = index;
        activity.updatedBy = req.user.userId;
        return activity;
      })
      .filter(Boolean);

    await itinerary.save();

    req.app.get("io").to(`trip:${tripId}`).emit("itinerary:updated", {
      tripId,
      dayNumber: Number(dayNumber),
      activities: itinerary.activities
    });

    return res.json({ itinerary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Deletes an activity from a day.
export async function deleteActivity(req, res, next) {
  try {
    const { tripId, dayNumber } = req.params;
    const hasAccess = await verifyMembership(tripId, req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { activityId } = deleteActivitySchema.parse(req.params);

    const itinerary = await Itinerary.findOne({ trip: tripId, dayNumber: Number(dayNumber) });
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary day not found" });
    }

    const nextActivities = itinerary.activities
      .filter((activity) => activity._id.toString() !== activityId)
      .map((activity, index) => ({
        ...activity.toObject(),
        position: index,
        updatedBy: req.user.userId
      }));

    if (nextActivities.length === itinerary.activities.length) {
      return res.status(404).json({ message: "Activity not found" });
    }

    itinerary.activities = nextActivities;
    await itinerary.save();

    req.app.get("io").to(`trip:${tripId}`).emit("itinerary:updated", {
      tripId,
      dayNumber: Number(dayNumber),
      activities: itinerary.activities
    });

    return res.json({ itinerary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}
