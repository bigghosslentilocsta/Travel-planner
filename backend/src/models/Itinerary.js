import mongoose from "mongoose";

// Holds day-by-day itinerary entries for a trip.
const activitySchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true
    },
    activityName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    location: {
      type: String,
      default: "",
      trim: true
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0
    },
    position: {
      type: Number,
      required: true,
      min: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const itinerarySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1
    },
    activities: [activitySchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

itinerarySchema.index({ trip: 1, dayNumber: 1 }, { unique: true });

export const Itinerary = mongoose.model("Itinerary", itinerarySchema);
