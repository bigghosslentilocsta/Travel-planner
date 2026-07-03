// Shows trip cards plus create/join/delete controls.
import { useMemo, useState, type FormEvent } from "react";
import { usePlannerStore } from "../../store/usePlannerStore";
import { motion } from "framer-motion";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Trip } from "../../types";

type TripGridProps = {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (payload: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    invitedEmails: string[];
  }) => Promise<void>;
  onJoinTrip: (payload: {
    tripName: string;
    tripCode: string;
  }) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
};

// Shows trip cards plus create, join, and delete controls.
export function TripGrid({ trips, selectedTripId, onSelectTrip, onCreateTrip, onJoinTrip, onDeleteTrip }: TripGridProps) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [joinTripName, setJoinTripName] = useState("");
  const [joinTripCode, setJoinTripCode] = useState("");

  const invitedEmails = useMemo(
    () => inviteInput.split(",").map((entry) => entry.trim()).filter(Boolean),
    [inviteInput]
  );

  // Submits the create-trip form.
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onCreateTrip({ title, destination, startDate, endDate, invitedEmails });

    setTitle("");
    setDestination("");
    setStartDate("");
    setEndDate("");
    setInviteInput("");
  }

  // Submits the join-trip form.
  async function handleJoinSubmit(event: FormEvent) {
    event.preventDefault();
    await onJoinTrip({
      tripName: joinTripName,
      tripCode: joinTripCode
    });

    setJoinTripName("");
    setJoinTripCode("");
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip, index) => (
          <motion.div
            key={trip._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectTrip(trip._id)}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
              selectedTripId === trip._id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-700 bg-slate-900/40 hover:border-slate-500"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Destination</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">{trip.destination}</h3>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (confirm(`Delete trip ${trip.title}?`)) {
                    void onDeleteTrip(trip._id);
                  }
                }}
                className="rounded-lg border border-rose-500/40 p-2 text-rose-300 hover:bg-rose-500/10"
                aria-label={`Delete ${trip.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-300">{trip.title}</p>
            <p className="mt-2 text-xs text-indigo-300">Code: {trip.tripCode}</p>
            <p className="mt-2 text-xs text-slate-400">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
            {selectedTripId === trip._id && (
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Members</p>
                <div className="mt-2 space-y-1">
                  {(trip.members || []).map((member) => {
                    const online = (usePlannerStore.getState().onlineMembers[selectedTripId || ""] || []).includes(member._id);
                    return (
                      <div key={member._id} className="flex items-center gap-2 text-sm text-slate-200">
                        <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-slate-600"}`} />
                        <span>{member.name}</span>
                      </div>
                    );
                  })}
                  {(trip.members || []).length === 0 && <p className="text-sm text-slate-400">No members found.</p>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <PlusCircle size={18} className="text-indigo-400" />
            <h3 className="font-semibold">Create New Trip</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Trip title" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
            <input value={destination} onChange={(event) => setDestination(event.target.value)} required placeholder="Destination" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
            <input value={startDate} onChange={(event) => setStartDate(event.target.value)} required type="date" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
            <input value={endDate} onChange={(event) => setEndDate(event.target.value)} required type="date" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save Trip</button>
        </form>

        <form onSubmit={handleJoinSubmit} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <h3 className="font-semibold">Join Trip</h3>
          </div>
          <div className="grid gap-3">
            <input
              value={joinTripName}
              onChange={(event) => setJoinTripName(event.target.value)}
              required
              placeholder="Trip name"
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={joinTripCode}
              onChange={(event) => setJoinTripCode(event.target.value.toUpperCase())}
              required
              placeholder="Trip code"
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm uppercase tracking-[0.2em]"
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Ask your friend for the exact trip name and code.</p>
          <button type="submit" className="mt-3 rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Join Trip</button>
        </form>
      </div>
    </section>
  );
}
