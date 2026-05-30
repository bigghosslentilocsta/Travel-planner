import { Message } from "../models/Message.js";
import { Trip } from "../models/Trip.js";

async function requireTripMember(tripId, userId) {
  const trip = await Trip.findOne({ _id: tripId, members: userId }).select("_id").lean();
  return trip;
}

export async function listMessages(req, res, next) {
  try {
    const { tripId } = req.params;
    const userId = req.user && req.user.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const isMember = await requireTripMember(tripId, userId);
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const messages = await Message.find({ trip: tripId }).sort({ createdAt: 1 }).populate("sender", "name avatarUrl");
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const { tripId } = req.params;
    const { content } = req.body;
    const userId = req.user && req.user.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const trip = await Trip.findOne({ _id: tripId, members: userId });
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const message = await Message.create({ trip: tripId, sender: userId, content });
    await message.populate("sender", "name avatarUrl");

    // emit via socket if available
    const io = req.app.get("io");
    if (io) {
      io.to(`trip:${tripId}`).emit("chat:message", message);
    }

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}
