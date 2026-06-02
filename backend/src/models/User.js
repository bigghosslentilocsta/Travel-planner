import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      trim: true,
      default: "",
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      // no default: leave undefined for social-auth accounts
      validate: {
        validator: function (v) {
          // Only enforce password length for local-auth users
          if (this.authProvider === "local") {
            return typeof v === "string" && v.length >= 8;
          }
          return true;
        },
        message: "Password must be at least 8 characters when using local auth"
      }
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "firebase"],
      default: "local"
    },
    googleId: {
      type: String,
      default: "",
      index: true
    },
    avatarUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const User = mongoose.model("User", userSchema);
