import { z } from "zod";
import { Expense } from "../models/Expense.js";
import { Settlement } from "../models/Settlement.js";
import { Trip } from "../models/Trip.js";
import { calculateSettlements } from "../utils/calculateSettlements.js";

// Tracks shared expenses and settlement summaries.
const expenseSchema = z.object({
  description: z.string().min(2).max(200),
  amount: z.number().positive()
});

const settleSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().positive()
});

// Loads a trip only when the user belongs to it.
async function getTripIfMember(tripId, userId) {
  const trip = await Trip.findById(tripId).populate("members", "name email");
  if (!trip) return null;

  const hasAccess = trip.members.some((member) => (member._id || member).toString() === userId);
  if (!hasAccess) return null;

  return trip;
}

// Lists expenses and settlement state for a trip.
export async function listExpenses(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await getTripIfMember(tripId, req.user.userId);
    if (!trip) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const expenses = await Expense.find({ trip: tripId })
      .populate("paidBy", "name email")
      .populate("shares.user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const settledRecords = await Settlement.find({ trip: tripId })
      .populate("fromUser", "name email")
      .populate("toUser", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const settlements = calculateSettlements(
      expenses.map((expense) => ({
        ...expense,
        paidBy: expense.paidBy._id,
        shares: expense.shares.map((share) => ({ user: share.user._id, amount: share.amount }))
      })),
      trip.members,
      settledRecords
    );

    return res.json({ expenses, settlements, settledRecords });
  } catch (error) {
    return next(error);
  }
}

// Adds a new expense and recalculates the split.
export async function addExpense(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await getTripIfMember(tripId, req.user.userId);
    if (!trip) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const input = expenseSchema.parse(req.body);

    const participants = trip.members;
    const perPerson = Number((input.amount / participants.length).toFixed(2));

    const shares = participants.map((participant, index) => {
      const participantId = participant._id || participant;
      if (index === participants.length - 1) {
        const allocated = perPerson * (participants.length - 1);
        return {
          user: participantId,
          amount: Number((input.amount - allocated).toFixed(2))
        };
      }

      return {
        user: participantId,
        amount: perPerson
      };
    });

    const expense = await Expense.create({
      trip: tripId,
      description: input.description,
      amount: input.amount,
      paidBy: req.user.userId,
      shares,
      createdBy: req.user.userId
    });

    req.app.get("io").to(`trip:${tripId}`).emit("expense:updated", {
      tripId,
      expense
    });

    return res.status(201).json({ expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Records a manual settlement payment between two users.
export async function settleExpense(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await getTripIfMember(tripId, req.user.userId);
    if (!trip) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const input = settleSchema.parse(req.body);
    const fromUserId = input.fromUserId.trim();
    const toUserId = input.toUserId.trim();

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: "Settlement participants must be different" });
    }

    if (req.user.userId !== toUserId) {
      return res.status(403).json({ message: "Only the user who is owed money can mark this as settled" });
    }

    const memberIds = trip.members.map((member) => (member._id || member).toString());
    if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
      return res.status(400).json({ message: "Settlement participants must belong to the trip" });
    }

    const settlement = await Settlement.create({
      trip: tripId,
      fromUser: fromUserId,
      toUser: toUserId,
      amount: input.amount,
      createdBy: req.user.userId
    });

    req.app.get("io").to(`trip:${tripId}`).emit("expense:updated", {
      tripId,
      settlement
    });

    return res.status(201).json({ settlement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}
