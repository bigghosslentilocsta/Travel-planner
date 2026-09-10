// Coordinates dashboard data loading and live socket updates.
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ExpensePanel } from "../components/dashboard/ExpensePanel";
import { ItineraryBoard } from "../components/dashboard/ItineraryBoard";
import { ChatPanel } from "../components/dashboard/ChatPanel";
import { TripGrid } from "../components/dashboard/TripGrid";
import type { SidebarSection } from "../components/layout/Sidebar";
import { useSocket } from "../hooks/useSocket";
import { usePlannerStore } from "../store/usePlannerStore";

// Extracts the current user's id from the session token.
function getUserIdFromToken(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.userId === "string" ? decoded.userId : null;
  } catch {
    return null;
  }
}

type TripDashboardPageProps = {
  token: string;
  onLogout: () => void;
  activeSection: SidebarSection;
};

// Coordinates dashboard data loading and live socket updates.
export function TripDashboardPage({ token, onLogout, activeSection }: TripDashboardPageProps) {
  const currentUserId = getUserIdFromToken(token);
  const {
    selectedTripId,
    trips,
    itinerary,
    expenses,
    settlements,
    settledRecords,
    setToken,
    setSelectedTripId,
    fetchTrips,
    fetchTripData,
    createTrip,
    joinTrip,
    deleteTrip,
    addActivity,
    deleteActivity,
    reorderDay,
    addExpense,
    settleExpense
  } = usePlannerStore();

  useEffect(() => {
    setToken(token);
    void fetchTrips();
  }, [token, setToken, fetchTrips]);

  useEffect(() => {
    if (!selectedTripId) return;
    void fetchTripData();
  }, [selectedTripId, fetchTripData]);

  useSocket(selectedTripId, token, (event, payload) => {
    if (!selectedTripId) return;

    if (event === "itinerary:updated" || event === "expense:updated") {
      void fetchTripData();
    }

    if (event === "presence:list") {
      const p: any = payload;
      if (Array.isArray(p?.onlineUserIds)) {
        usePlannerStore.getState().setOnlineMembers(selectedTripId, p.onlineUserIds);
      }
    }

    if (event === "chat:message") {
      const msg: any = payload;
      // If message belongs to another trip, increment unread
      if (msg && msg.trip && msg.trip !== selectedTripId) {
        usePlannerStore.getState().incrementUnread(msg.trip);
      }
      // otherwise ChatPanel will receive the DOM event and append
    }
  });

  return (
    <main className="relative z-10 space-y-6 p-4 md:p-8">
      {/* Header bar */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-400">Real-time group planning</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800">Trip Itinerary Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-coral-400/30 bg-coral-500/10 px-4 py-2 text-sm font-medium text-coral-600 transition-colors hover:bg-coral-500/20"
          >
            Logout
          </button>
        </div>
      </motion.header>

      {activeSection === "trips" && (
        <TripGrid
          trips={trips}
          selectedTripId={selectedTripId}
          onSelectTrip={setSelectedTripId}
          onCreateTrip={createTrip}
          onJoinTrip={joinTrip}
          onDeleteTrip={deleteTrip}
        />
      )}

      {activeSection === "itinerary" && (
        <>
          <ItineraryBoard
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            itinerary={itinerary}
            onAddActivity={addActivity}
            onDeleteActivity={deleteActivity}
            onReorderDay={reorderDay}
          />

          <ChatPanel
            tripId={selectedTripId}
            token={token}
            currentUserId={currentUserId}
            trips={trips}
            onSelectTrip={setSelectedTripId}
          />
        </>
      )}

      {activeSection === "expenses" && (
        <ExpensePanel
          trips={trips}
          selectedTripId={selectedTripId}
          onSelectTrip={setSelectedTripId}
          expenses={expenses}
          settlements={settlements}
          settledRecords={settledRecords}
          currentUserId={currentUserId}
          onAddExpense={addExpense}
          onSettleExpense={settleExpense}
        />
      )}
    </main>
  );
}
