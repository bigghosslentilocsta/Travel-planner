import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  // Opens the database connection used by the API.
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
