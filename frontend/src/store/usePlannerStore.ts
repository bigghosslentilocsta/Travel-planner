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

  setToken: (token) => set({ token }),
  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),

  setOnlineMembers: (tripId, ids) => set((s) => ({ onlineMembers: { ...(s.onlineMembers || {}), [tripId]: ids } })),
  addOnlineMember: (tripId, id) => set((s) => {
    const prev = new Set(s.onlineMembers[tripId] || []);
    prev.add(id);
    return { onlineMembers: { ...(s.onlineMembers || {}), [tripId]: Array.from(prev) } };
  }),
  removeOnlineMember: (tripId, id) => set((s) => {
    const prev = new Set(s.onlineMembers[tripId] || []);
    prev.delete(id);
    return { onlineMembers: { ...(s.onlineMembers || {}), [tripId]: Array.from(prev) } };
  }),
  incrementUnread: (tripId) => set((s) => ({ unreadCounts: { ...(s.unreadCounts || {}), [tripId]: (s.unreadCounts[tripId] || 0) + 1 } })),
  clearUnread: (tripId) => set((s) => ({ unreadCounts: { ...(s.unreadCounts || {}), [tripId]: 0 } })),

  fetchTrips: async () => {
    const { token } = get();
    if (!token) return;

    const data = await apiFetch<{ trips: Trip[] }>("/trips", {}, token);
    set((state) => ({
      trips: data.trips,
      selectedTripId: state.selectedTripId && data.trips.some((trip) => trip._id === state.selectedTripId) ? state.selectedTripId : null
    }));
  },

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

  createTrip: async (payload) => {
    const { token } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch("/trips", { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTrips();
  },

  joinTrip: async (payload) => {
    const { token } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch("/trips/join", { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTrips();
  },

  deleteTrip: async (tripId) => {
    const { token, selectedTripId } = get();
    if (!token) throw new Error("Missing token");

    await apiFetch(`/trips/${tripId}`, { method: "DELETE" }, token);
    if (selectedTripId === tripId) {
      set({ selectedTripId: null, itinerary: [], expenses: [], settlements: [], settledRecords: [] });
    }
    await get().fetchTrips();
  },

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

  addExpense: async (payload) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(`/trips/${selectedTripId}/expenses`, { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTripData();
  },

  settleExpense: async (payload) => {
    const { token, selectedTripId } = get();
    if (!token || !selectedTripId) return;

    await apiFetch(`/trips/${selectedTripId}/expenses/settle`, { method: "POST", body: JSON.stringify(payload) }, token);
    await get().fetchTripData();
  }
}));
