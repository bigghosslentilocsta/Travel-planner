// Holds trip, itinerary, expense, and presence state for the UI.
import { create } from "zustand";
import { apiFetch } from "../api/client";
import type { Expense, ItineraryDay, Settlement, SettledRecord, Trip } from "../types";

type PlannerState = {
  token: string | null;
  selectedTripId: string | null;
  trips: Trip[];
  itinerary: ItineraryDay[];
  expenses: Expense[];
  settlements: Settlement[];
  settledRecords: SettledRecord[];
  setToken: (token: string) => void;
  setSelectedTripId: (tripId: string) => void;
  fetchTrips: () => Promise<void>;
  fetchTripData: () => Promise<void>;
  createTrip: (payload: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    invitedEmails: string[];
  }) => Promise<void>;
  joinTrip: (payload: {
    tripName: string;
    tripCode: string;
  }) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  addActivity: (dayNumber: number, payload: {
    time: string;
    activityName: string;
    location: string;
    estimatedCost: number;
  }) => Promise<void>;
  deleteActivity: (dayNumber: number, activityId: string) => Promise<void>;
  reorderDay: (dayNumber: number, activityIds: string[]) => Promise<void>;
  addExpense: (payload: {
    description: string;
    amount: number;
  }) => Promise<void>;
  settleExpense: (payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
  }) => Promise<void>;
  onlineMembers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
  setOnlineMembers: (tripId: string, ids: string[]) => void;
  addOnlineMember: (tripId: string, id: string) => void;
  removeOnlineMember: (tripId: string, id: string) => void;
  incrementUnread: (tripId: string) => void;
  clearUnread: (tripId: string) => void;
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  token: null,
  selectedTripId: null,
  trips: [],
  itinerary: [],
  expenses: [],
  settlements: [],
  settledRecords: [],
  onlineMembers: {},
  unreadCounts: {},

  // Saves the current auth token.
  setToken: (token) => set({ token }),
  // Updates the active trip selection.
  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),

  // Replaces the online-member list for a trip.
  setOnlineMembers: (tripId, ids) => set((s) => ({ onlineMembers: { ...(s.onlineMembers || {}), [tripId]: ids } })),
  // Adds one user to the online-member list.
  addOnlineMember: (tripId, id) => set((s) => {
    const prev = new Set(s.onlineMembers[tripId] || []);
    prev.add(id);
    return { onlineMembers: { ...(s.onlineMembers || {}), [tripId]: Array.from(prev) } };
  }),
  // Removes one user from the online-member list.
  removeOnlineMember: (tripId, id) => set((s) => {
    const prev = new Set(s.onlineMembers[tripId] || []);
    prev.delete(id);
    return { onlineMembers: { ...(s.onlineMembers || {}), [tripId]: Array.from(prev) } };
  }),
  // Increments the unread counter for a trip.
  incrementUnread: (tripId) => set((s) => ({ unreadCounts: { ...(s.unreadCounts || {}), [tripId]: (s.unreadCounts[tripId] || 0) + 1 } })),
  // Clears the unread counter for a trip.
  clearUnread: (tripId) => set((s) => ({ unreadCounts: { ...(s.unreadCounts || {}), [tripId]: 0 } })),

  // Fetches the user's trips from the API.
  fetchTrips: async () => {
    const { token } = get();
    if (!token) return;

    const data = await apiFetch<{ trips: Trip[] }>("/trips", {}, token);
    set((state) => ({
      trips: data.trips,
      selectedTripId: state.selectedTripId && data.trips.some((trip) => trip._id === state.selectedTripId) ? state.selectedTripId : null
    }));
  },

  // Fetches itinerary and expense data for the selected trip.
  fetchTripData: async () => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    const [itineraryData, expenseData] = await Promise.all([
      apiFetch<{ itinerary: ItineraryDay[] }>(`/trips/${selectedTripId}/itinerary`, {}, token),
      apiFetch<{ expenses: Expense[]; settlements: Settlement[]; settledRecords: SettledRecord[] }>(`/trips/${selectedTripId}/expenses`, {}, token)
    ]);

    set({
      itinerary: itineraryData.itinerary,
      expenses: expenseData.expenses,
      settlements: expenseData.settlements,
      settledRecords: expenseData.settledRecords
    });
  },

  // Creates a new trip through the backend.
  createTrip: async (payload) => {
    const { token } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch("/trips", { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTrips();
  },

  // Joins an existing trip with its invite code.
  joinTrip: async (payload) => {
    const { token } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch("/trips/join", { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTrips();
  },

  // Deletes a trip and clears local state if needed.
  deleteTrip: async (tripId) => {
    const { token, selectedTripId } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch(`/trips/${tripId}`, { method: "DELETE" }, token);
    if (selectedTripId === tripId) {
      set({ selectedTripId: null, itinerary: [], expenses: [], settlements: [], settledRecords: [] });
    }
    await get().fetchTrips();
  },

  // Adds a trip activity for a specific day.
  addActivity: async (dayNumber, payload) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(
      `/trips/${selectedTripId}/itinerary/day/${dayNumber}/activities`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    );
    await get().fetchTripData();
  },

  // Deletes a trip activity from a specific day.
  deleteActivity: async (dayNumber, activityId) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(
      `/trips/${selectedTripId}/itinerary/day/${dayNumber}/activities/${activityId}`,
      { method: "DELETE" },
      token
    );
    await get().fetchTripData();
  },

  // Reorders the activities inside a day.
  reorderDay: async (dayNumber, activityIds) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(
      `/trips/${selectedTripId}/itinerary/day/${dayNumber}/reorder`,
      { method: "PUT", body: JSON.stringify({ activityIds }) },
      token
    );
    await get().fetchTripData();
  },

  // Adds a new shared expense.
  addExpense: async (payload) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(`/trips/${selectedTripId}/expenses`, { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTripData();
  },

  // Records a settlement payment.
  settleExpense: async (payload) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(`/trips/${selectedTripId}/expenses/settle`, { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTripData();
  }
}));
