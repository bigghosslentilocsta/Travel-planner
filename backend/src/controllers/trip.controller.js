import crypto from "crypto";
import { z } from "zod";
import { Expense } from "../models/Expense.js";
import { Itinerary } from "../models/Itinerary.js";
import { Trip } from "../models/Trip.js";

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

function generateTripCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}

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

export async function createTrip(req, res, next) {
  try {
    const input = createTripSchema.parse(req.body);

    if (input.endDate < input.startDate) {
      return res.status(400).json({ message: "End date must be after start date" });
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
      trip.members.push(memberId);
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
