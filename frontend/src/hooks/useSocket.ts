// Connects the browser to the trip socket room.
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

// Connects the browser to the current trip's socket room.
export function useSocket(tripId: string | null, token: string | null, onEvent: (event: string, payload: unknown) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!tripId || !token) return;

    // Extracts the user id from the JWT payload.
    function getUserIdFromToken(t: string) {
      try {
        const payload = t.split(".")[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(padded));
        return typeof decoded.userId === "string" ? decoded.userId : null;
      } catch {
        return null;
      }
    }

    const userId = getUserIdFromToken(token);

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token, user: { id: userId } }
    });

    socketRef.current = socket;

    socket.emit("trip:join", { tripId, user: { id: getUserIdFromToken(token) } });
    socket.on("itinerary:updated", (payload) => onEvent("itinerary:updated", payload));
    socket.on("expense:updated", (payload) => onEvent("expense:updated", payload));
    socket.on("chat:message", (payload) => {
      // dispatch as a DOM event for lightweight integration with components
      window.dispatchEvent(new CustomEvent("tp:chat:new", { detail: payload }));
      onEvent("chat:message", payload);
    });
    socket.on("presence:update", (payload) => {
      window.dispatchEvent(new CustomEvent("tp:presence:update", { detail: payload }));
      onEvent("presence:update", payload);
    });
    socket.on("presence:list", (payload) => {
      window.dispatchEvent(new CustomEvent("tp:presence:list", { detail: payload }));
      onEvent("presence:list", payload);
    });
    socket.on("chat:typing", (payload) => {
      window.dispatchEvent(new CustomEvent("tp:chat:typing", { detail: payload }));
      onEvent("chat:typing", payload);
    });

    return () => {
      socket.emit("trip:leave", { tripId });
      socket.disconnect();
    };
  }, [tripId, token, onEvent]);

  return socketRef;
}
