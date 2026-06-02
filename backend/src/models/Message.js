import mongoose from "mongoose";

// Persists chat messages exchanged inside a trip.
const messageSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const Message = mongoose.model("Message", messageSchema);
