import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { User } from "../models/User.js";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  avatarUrl: z.string().max(4000000).refine(
    (value) => value === "" || value.startsWith("data:image/") || /^https?:\/\//i.test(value),
    "Profile picture must be an image"
  )
});

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("name email avatarUrl").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trips = await Trip.find({ members: req.user.userId }).select("startDate endDate").lean();
    const now = new Date();
    const completed = trips.filter((trip) => new Date(trip.endDate) < now).length;
    const upcoming = trips.filter((trip) => new Date(trip.startDate) > now).length;

    return res.json({
      profile: user,
      stats: {
        planned: trips.length,
        upcoming,
        completed
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const input = profileSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: input },
      { new: true, runValidators: true }
    ).select("name email avatarUrl");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ profile: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid profile" });
    }
    return next(error);
  }
}
