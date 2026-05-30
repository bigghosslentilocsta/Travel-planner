import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    shares: {
      type: [shareSchema],
      validate: {
        validator: (shares) => shares.length > 0,
        message: "At least one share is required"
      }
    },
    settled: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Expense = mongoose.model("Expense", expenseSchema);
