// Wires socket rooms and real-time trip events.
import { Trip } from "../models/Trip.js";

export function initializeSocket(io) {
  // in-memory presence map: tripId -> Set<userId>
  const presence = new Map();
  // track last emission times to throttle presence broadcasts
  const lastEmit = new Map();
  const scheduled = new Map();
  const EMIT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  io.on("connection", (socket) => {
    const authUser = socket.handshake?.auth?.user || null;

    // Emits the current presence list for a trip immediately.
    function emitPresenceListNow(tripId) {
      const set = presence.get(tripId) || new Set();
      io.to(`trip:${tripId}`).emit("presence:list", { tripId, onlineUserIds: Array.from(set) });
      lastEmit.set(tripId, Date.now());
      const t = scheduled.get(tripId);
      if (t) {
        clearTimeout(t);
        scheduled.delete(tripId);
      }
    }

    // Throttles presence updates so the room is not spammed.
    function schedulePresenceEmit(tripId) {
      const last = lastEmit.get(tripId) || 0;
      const now = Date.now();
      if (now - last >= EMIT_INTERVAL_MS) {
        // emit immediately
        emitPresenceListNow(tripId);
        return;
      }
      // otherwise schedule for the time when interval completes
      const remaining = EMIT_INTERVAL_MS - (now - last);
      if (scheduled.has(tripId)) return; // already scheduled
      const timer = setTimeout(() => emitPresenceListNow(tripId), remaining + 50);
      scheduled.set(tripId, timer);
    }

    socket.on("trip:join", async ({ tripId, user }) => {
      const uid = (user && user.id) || (authUser && authUser.id) || null;
      if (!uid || !tripId) return;

      const trip = await Trip.findOne({ _id: tripId, members: uid }).select("_id").lean();
      if (!trip) {
        socket.emit("chat:error", { tripId, message: "Forbidden" });
        return;
      }

      socket.join(`trip:${tripId}`);
      const set = presence.get(tripId) || new Set();
      set.add(uid);
      presence.set(tripId, set);
      // schedule a throttled presence list emit
      schedulePresenceEmit(tripId);
    });

    socket.on("trip:leave", ({ tripId, user }) => {
      socket.leave(`trip:${tripId}`);
      const uid = (user && user.id) || (authUser && authUser.id) || null;
      if (uid) {
        const set = presence.get(tripId) || new Set();
        set.delete(uid);
        presence.set(tripId, set);
        // schedule a throttled presence list emit
        schedulePresenceEmit(tripId);
      }
    });

    socket.on("chat:typing", ({ tripId, user, typing }) => {
      const uid = (user && user.id) || (authUser && authUser.id) || null;
      // typing events can be frequent; broadcast but don't persist
      socket.to(`trip:${tripId}`).emit("chat:typing", { user: { id: uid }, typing });
    });

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r.startsWith("trip:"));
      const uid = (authUser && authUser.id) || null;
      rooms.forEach((room) => {
        const tripId = room.replace(/^trip:/, "");
        if (uid) {
          const set = presence.get(tripId) || new Set();
          set.delete(uid);
          presence.set(tripId, set);
          // schedule a throttled presence list emit
          schedulePresenceEmit(tripId);
        }
      });
    });
  });

  // Periodically emit presence lists for all trips (safety net, every EMIT_INTERVAL_MS)
  setInterval(() => {
    for (const tripId of presence.keys()) {
      const last = lastEmit.get(tripId) || 0;
      if (Date.now() - last >= EMIT_INTERVAL_MS) {
        const set = presence.get(tripId) || new Set();
        io.to(`trip:${tripId}`).emit("presence:list", { tripId, onlineUserIds: Array.from(set) });
        lastEmit.set(tripId, Date.now());
      }
    }
  }, EMIT_INTERVAL_MS);
}
