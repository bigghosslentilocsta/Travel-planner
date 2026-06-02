// Loads trip chat history and sends new messages.
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../api/client";
import type { Trip } from "../../types";

type Message = {
  _id: string;
  content: string;
  sender: { _id: string; name: string; avatarUrl?: string };
  createdAt: string;
};

// Loads trip chat history and sends new messages.
export function ChatPanel({ tripId, token, currentUserId, trips, onSelectTrip }: { tripId: string | null; token: string | null; currentUserId: string | null; trips: Trip[]; onSelectTrip: (tripId: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!tripId || !token) return;
    let cancelled = false;
    setError("");
    void apiFetch(`/trips/${tripId}/chat`, {}, token)
      .then((data) => {
        if (!cancelled) setMessages(data as Message[]);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessages([]);
          setError(err instanceof Error ? err.message : "Unable to load chat");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, token]);

  useEffect(() => {
    // Appends a newly received chat message.
    const handleNew = (e: any) => {
      if (e && e.detail) {
        const msg = e.detail as Message;
        setMessages((m) => [...m, msg]);
      }
    };
    window.addEventListener("tp:chat:new", handleNew as any);

    // Updates remote typing indicators.
    const handleTyping = (ev: any) => {
      const payload = ev?.detail;
      if (!payload) return;
      const uid = payload.user?.id;
      if (!uid) return;
      setTypingUsers((t) => ({ ...t, [uid]: !!payload.typing }));
      // clear typing after a short timeout
      if (payload.typing) {
        setTimeout(() => setTypingUsers((t) => ({ ...t, [uid]: false })), 3000);
      }
    };

    window.addEventListener("tp:chat:typing", handleTyping as any);
    return () => window.removeEventListener("tp:chat:new", handleNew as any);
  }, []);

  useEffect(() => {
    // no-op placeholder for presence:list
    return () => {};
  }, []);

  const send = async () => {
    if (!tripId || !token || !draft.trim()) return;
    try {
      await apiFetch(`/trips/${tripId}/chat`, { method: "POST", body: JSON.stringify({ content: draft.trim() }) }, token);
      setDraft("");
      setError("");
    } catch {
      setError("Unable to send message. Make sure you are a trip member and selected the correct trip.");
    }
  };

  const rendered = useMemo(() => messages.map((m) => (
    <div key={m._id} className={`flex items-start gap-3 ${m.sender._id === currentUserId ? "justify-end" : "justify-start"}`}>
      {m.sender.avatarUrl && m.sender._id !== currentUserId && (
        <img src={m.sender.avatarUrl} alt={m.sender.name} className="h-8 w-8 rounded-full object-cover" />
      )}
      <div className="max-w-[70%] rounded-xl bg-slate-800/60 p-3 text-sm text-slate-100">
        <div className="font-medium text-slate-200">{m.sender.name}</div>
        <div className="mt-1">{m.content}</div>
        <div className="mt-1 text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
      </div>
    </div>
  )), [messages, currentUserId]);

  useEffect(() => {
    // auto-scroll to bottom when messages change
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  if (!tripId) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/35 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Trip Chat</h3>
        <p className="mt-2 text-sm text-slate-300">Select a trip to view and send messages.</p>
        <select
          value=""
          onChange={(event) => onSelectTrip(event.target.value)}
          className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
        >
          <option value="" disabled>
            Choose a trip
          </option>
          {trips.map((trip) => (
            <option key={trip._id} value={trip._id}>
              {trip.title} - {trip.destination}
            </option>
          ))}
        </select>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/35 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Trip Chat</h3>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      <div ref={containerRef} className="mt-3 flex max-h-64 flex-col gap-2 overflow-auto">{rendered}</div>
      {Object.keys(typingUsers).some((k) => typingUsers[k]) && (
        <div className="mt-2 text-xs text-slate-400">Someone is typing...</div>
      )}

      <div className="mt-3 flex gap-2">
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 rounded-lg border border-slate-600 bg-slate-800/40 px-3 py-2 text-sm text-slate-100" placeholder="Message the group..." />
        <button onClick={send} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">Send</button>
      </div>
    </section>
  );
}
