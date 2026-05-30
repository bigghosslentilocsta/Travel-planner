import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { Clock3, GripVertical, MapPin, Trash2, Wallet } from "lucide-react";
import type { Activity, ItineraryDay, Trip } from "../../types";

type ItineraryBoardProps = {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  itinerary: ItineraryDay[];
  onAddActivity: (dayNumber: number, payload: {
    time: string;
    activityName: string;
    location: string;
    estimatedCost: number;
  }) => Promise<void>;
  onReorderDay: (dayNumber: number, activityIds: string[]) => Promise<void>;
  onDeleteActivity: (dayNumber: number, activityId: string) => Promise<void>;
};

export function ItineraryBoard({ trips, selectedTripId, onSelectTrip, itinerary, onAddActivity, onReorderDay, onDeleteActivity }: ItineraryBoardProps) {
  const [dayNumber, setDayNumber] = useState(1);
  const [time, setTime] = useState("09:00");
  const [activityName, setActivityName] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [dragState, setDragState] = useState<{ day: number; activityId: string } | null>(null);

  const orderedDays = useMemo(
    () => itinerary.map((day) => ({ ...day, activities: [...day.activities].sort((a, b) => a.position - b.position) })),
    [itinerary]
  );

  async function handleAddActivity(event: FormEvent) {
    event.preventDefault();
    await onAddActivity(dayNumber, { time, activityName, location, estimatedCost });
    setActivityName("");
    setLocation("");
    setEstimatedCost(0);
  }

  async function handleDrop(day: ItineraryDay, targetId: string) {
    if (!dragState || dragState.day !== day.dayNumber) return;

    const nextActivities = [...day.activities];
    const sourceIndex = nextActivities.findIndex((activity) => activity._id === dragState.activityId);
    const targetIndex = nextActivities.findIndex((activity) => activity._id === targetId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const [moved] = nextActivities.splice(sourceIndex, 1);
    nextActivities.splice(targetIndex, 0, moved);

    await onReorderDay(day.dayNumber, nextActivities.map((activity) => activity._id));
    setDragState(null);
  }

  function activityCard(day: ItineraryDay, activity: Activity) {
    return (
      <article
        key={activity._id}
        draggable
        onDragStart={() => setDragState({ day: day.dayNumber, activityId: activity._id })}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => void handleDrop(day, activity._id)}
        className="rounded-xl border border-slate-700 bg-slate-900/70 p-3"
      >
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2 text-sm">
            <Clock3 size={14} className="text-indigo-400" />
            {activity.time}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void onDeleteActivity(day.dayNumber, activity._id);
              }}
              className="rounded-md p-1 text-rose-300 hover:bg-rose-500/10"
              aria-label={`Delete ${activity.activityName}`}
            >
              <Trash2 size={14} />
            </button>
            <GripVertical size={14} className="text-slate-500" />
          </div>
        </div>

        <h4 className="mt-2 text-sm font-semibold text-slate-100">{activity.activityName}</h4>

        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><MapPin size={12} /> {activity.location || "TBD"}</span>
          <span className="flex items-center gap-1"><Wallet size={12} /> ${activity.estimatedCost.toFixed(2)}</span>
        </div>
      </article>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/35 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-200">Select Trip for Itinerary</label>
        <select
          value={selectedTripId || ""}
          onChange={(event) => onSelectTrip(event.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
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
        {/* AI Suggest button */}
        {selectedTripId && (
          <div className="mt-3">
            {/* Lazy load to avoid circular imports; import here */}
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <AISuggestWrapper tripId={selectedTripId} trips={trips} />
          </div>
        )}
      </div>

      {/* Wrapper component to import AISuggest without top-level circular import */}
      {/* Inserted at end of file to keep flow */}


      <form onSubmit={handleAddActivity} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-100">Add Activity</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <input type="number" min={1} value={dayNumber} onChange={(event) => setDayNumber(Number(event.target.value))} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" placeholder="Day" />
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
          <input required value={activityName} onChange={(event) => setActivityName(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" placeholder="Activity" />
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" placeholder="Location" />
          <input type="number" min={0} step="0.01" value={estimatedCost} onChange={(event) => setEstimatedCost(Number(event.target.value))} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" placeholder="Cost" />
        </div>
        <button className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" type="submit">Add To Timeline</button>
      </form>

      <div className="grid gap-3 lg:grid-cols-2">
        {orderedDays.map((day) => (
          <div key={day._id} className="rounded-2xl border border-slate-700 bg-slate-900/35 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Day {day.dayNumber}</h3>
              <span className="rounded-full border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-xs text-indigo-200">
                {day.activities.length} activities
              </span>
            </div>
            <div className="space-y-2">{day.activities.map((activity) => activityCard(day, activity))}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AISuggestWrapper({ tripId, trips }: { tripId: string; trips: { _id: string; destination?: string }[] }) {
  const [AISuggestComp, setAISuggestComp] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    import("./AISuggest")
      .then((mod) => {
        if (mounted && mod && mod.AISuggest) setAISuggestComp(() => mod.AISuggest as ComponentType<any>);
      })
      .catch(() => {
        // ignore dynamic import errors (component will remain null)
      });
    return () => {
      mounted = false;
    };
  }, [tripId]);

  const trip = trips.find((t) => t._id === tripId);
  const destination = trip?.destination || "";
  const token = localStorage.getItem("tp_token") || "";

  if (!AISuggestComp) return null;

  const AISuggest = AISuggestComp;
  return <AISuggest tripId={tripId} token={token} destination={destination} />;
}
