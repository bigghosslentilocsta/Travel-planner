import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { initializeFirebaseAdmin } from "./config/firebaseAdmin.js";
import authRoutes from "./routes/auth.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { initializeSocket } from "./socket/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  }
});

app.set("io", io);

initializeFirebaseAdmin();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips/:tripId/itinerary", itineraryRoutes);
app.use("/api/trips/:tripId/expenses", expenseRoutes);
app.use("/api/trips/:tripId/chat", chatRoutes);
app.use("/api/trips/:tripId/ai", aiRoutes);

app.use(errorHandler);

initializeSocket(io);

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required");
}

await connectDB(mongoUri);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
