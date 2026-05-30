import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    tripCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      minlength: 6,
      maxlength: 8
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    invitedEmails: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

tripSchema.index({ members: 1, startDate: 1 });

export const Trip = mongoose.model("Trip", tripSchema);
