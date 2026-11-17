import crypto from "crypto";
import { z } from "zod";
import { Expense } from "../models/Expense.js";
import { Itinerary } from "../models/Itinerary.js";
import { Trip } from "../models/Trip.js";
import { User } from "../models/User.js";

// Manages trip creation, membership, and trip-level updates.
const createTripSchema = z.object({
  title: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  invitedEmails: z.array(z.string().email()).default([])
});

const joinTripSchema = z.object({
  tripName: z.string().min(2).max(120),
  tripCode: z.string().min(4).max(12)
});

const inviteSchema = z.object({
  email: z.string().email()
});

// Generates a short invite code for a trip.
function generateTripCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

// Keeps generating codes until one is unused.
async function createUniqueTripCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const tripCode = generateTripCode();
    const existingTrip = await Trip.findOne({ tripCode }).lean();
    if (!existingTrip) {
      return tripCode;
    }

  }

  throw new Error("Failed to generate a unique trip code");
}

async function createUniqueInviteToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteToken = generateInviteToken();
    const existingTrip = await Trip.findOne({ inviteToken }).lean();
    if (!existingTrip) {
      return inviteToken;
    }
  }

  throw new Error("Failed to generate a unique invite link");
}

// Returns all trips that include the current user.
export async function listTrips(req, res, next) {
  try {
    const trips = await Trip.find({ members: req.user.userId })
      .populate("members", "name email")
      .sort({ startDate: 1 })
      .lean();

    return res.json({ trips });
  } catch (error) {
    return next(error);
  }
}

// Creates a new trip and optional invitation records.
export async function createTrip(req, res, next) {
  try {
    const input = createTripSchema.parse(req.body);

    if (input.endDate < input.startDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Prevent overlapping trips for the same user
    const existingTrips = await Trip.find({ members: req.user.userId }).lean();
    for (const existing of existingTrips) {
      const eStart = new Date(existing.startDate);
      const eEnd = new Date(existing.endDate);
      if (input.startDate <= eEnd && eStart <= input.endDate) {
        return res.status(409).json({
          message: `Schedule conflict: you already have "${existing.title}" on ${eStart.toLocaleDateString()} – ${eEnd.toLocaleDateString()}. Please choose non-overlapping dates.`
        });
      }
    }

    const uniqueInvites = [...new Set(input.invitedEmails.map((email) => email.toLowerCase()))];
    const tripCode = await createUniqueTripCode();

    const trip = await Trip.create({
      ...input,
      invitedEmails: uniqueInvites,
      tripCode,
      createdBy: req.user.userId,
      members: [req.user.userId]
    });

    return res.status(201).json({ trip });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Adds a user to a trip when they provide a valid invite code.
export async function inviteMember(req, res, next) {
  try {
    const { tripId } = req.params;
    const { email } = inviteSchema.parse(req.body);

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const isMember = trip.members.some((member) => member.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!trip.invitedEmails.includes(email.toLowerCase())) {
      trip.invitedEmails.push(email.toLowerCase());
      await trip.save();
    }

    return res.json({ trip });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Creates a shareable invite link for a trip member.
export async function createInviteLink(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const isMember = trip.members.some((member) => member.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!trip.inviteToken) {
      trip.inviteToken = await createUniqueInviteToken();
      await trip.save();
    }

    return res.json({ inviteToken: trip.inviteToken });
  } catch (error) {
    return next(error);
  }
}

// Escapes trip names before building a case-insensitive search.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lets a user join a trip by name and invite code.
export async function joinTrip(req, res, next) {
  try {
    const input = joinTripSchema.parse(req.body);
    const tripCode = input.tripCode.trim().toUpperCase();
    const tripName = input.tripName.trim();

    const trip = await Trip.findOne({
      tripCode,
      title: new RegExp(`^${escapeRegex(tripName)}$`, "i")
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip name or code is incorrect" });
    }

    const memberId = req.user.userId.toString();
    const alreadyMember = trip.members.some((member) => member.toString() === memberId);
    if (!alreadyMember) {
      // Prevent joining a trip that overlaps with existing trips
      const existingTrips = await Trip.find({ members: req.user.userId }).lean();
      for (const existing of existingTrips) {
        const eStart = new Date(existing.startDate);
        const eEnd = new Date(existing.endDate);
        if (new Date(trip.startDate) <= eEnd && eStart <= new Date(trip.endDate)) {
          return res.status(409).json({
            message: `Schedule conflict: you already have "${existing.title}" on ${eStart.toLocaleDateString()} – ${eEnd.toLocaleDateString()}. This trip overlaps and cannot be joined.`
          });
        }
      }
      trip.members.push(memberId);
      await trip.save();
    }

    return res.json({ trip, alreadyMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Adds an authenticated user to a trip from a shareable invite link.
export async function joinTripByInvite(req, res, next) {
  try {
    const trip = await Trip.findOne({ inviteToken: req.params.inviteToken });
    if (!trip) {
      return res.status(404).json({ message: "Invite link is invalid or expired" });
    }

    const memberId = req.user.userId.toString();
    const alreadyMember = trip.members.some((member) => member.toString() === memberId);
    if (!alreadyMember) {
      const existingTrips = await Trip.find({ members: req.user.userId }).lean();
      for (const existing of existingTrips) {
        const eStart = new Date(existing.startDate);
        const eEnd = new Date(existing.endDate);
        if (new Date(trip.startDate) <= eEnd && eStart <= new Date(trip.endDate)) {
          return res.status(409).json({
            message: `Schedule conflict: you already have "${existing.title}" on ${eStart.toLocaleDateString()} – ${eEnd.toLocaleDateString()}. This trip overlaps and cannot be joined.`
          });
        }
      }

      trip.members.push(memberId);
      await trip.save();
    }

    return res.json({
      trip,
      alreadyMember,
      message: alreadyMember ? "You are already in this trip" : "You were added to the trip"
    });
  } catch (error) {
    return next(error);
  }
}

// Removes the current user from a trip before it starts.
export async function exitTrip(req, res, next) {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, members: req.user.userId });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or you are not a member" });
    }

    if (new Date() >= new Date(trip.startDate)) {
      return res.status(409).json({ message: "You cannot exit after the trip has started" });
    }

    const user = await User.findById(req.user.userId).select("name email").lean();
    trip.members = trip.members.filter((member) => member.toString() !== req.user.userId);
    await trip.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`trip:${trip._id}`).emit("trip:member-exited", {
        tripId: trip._id.toString(),
        memberId: req.user.userId,
        memberName: user?.name || user?.email || "A member"
      });
    }

    return res.json({ message: "You exited the trip" });
  } catch (error) {
    return next(error);
  }
}

// Removes a trip when requested by a member.
export async function deleteTrip(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId).select("createdBy");

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the trip creator can delete this trip" });
    }

    await Promise.all([
      Trip.deleteOne({ _id: tripId }),
      Itinerary.deleteMany({ trip: tripId }),
      Expense.deleteMany({ trip: tripId })
    ]);

    return res.json({ message: "Trip deleted" });
  } catch (error) {
    return next(error);
  }
}
