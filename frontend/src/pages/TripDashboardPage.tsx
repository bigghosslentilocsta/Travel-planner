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
    <main className="space-y-6 p-4 md:p-8">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-700 bg-slate-900/35 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Real-time group planning</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-100">Trip Itinerary Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-slate-400"
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
