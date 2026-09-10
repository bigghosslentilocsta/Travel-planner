// Manages expense entry and settlement summaries.
import { useState, type FormEvent } from "react";
import { BadgeDollarSign } from "lucide-react";
import type { Expense, Settlement, SettledRecord, Trip } from "../../types";

type ExpensePanelProps = {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  currentUserId: string | null;
  expenses: Expense[];
  settlements: Settlement[];
  settledRecords: SettledRecord[];
  onAddExpense: (payload: {
    description: string;
    amount: number;
  }) => Promise<void>;
  onSettleExpense: (payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
  }) => Promise<void>;
};

// Manages expense entry and settlement summaries.
export function ExpensePanel({ trips, selectedTripId, onSelectTrip, currentUserId, expenses, settlements, settledRecords, onAddExpense, onSettleExpense }: ExpensePanelProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  // Submits a new shared expense.
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onAddExpense({ description, amount });

    setDescription("");
    setAmount(0);
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Select Trip for Expenses</label>
        <select
          value={selectedTripId || ""}
          onChange={(event) => onSelectTrip(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
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
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-600">
          <BadgeDollarSign size={18} className="text-brand-500" />
          <h3 className="font-semibold">Log Group Expense</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input required value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" placeholder="Description" />
          <input required type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" placeholder="Total amount" />
        </div>
        <p className="mt-2 text-xs text-slate-400">This expense will be split evenly across all members of the selected trip.</p>
        <button type="submit" className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all">Add Expense</button>
      </form>

      <div className="glass-card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Recent Expenses</h3>
        <div className="space-y-2">
          {expenses.map((expense) => (
            <article key={expense._id} className="glass-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-800">{expense.description}</p>
                <p className="text-sm font-semibold text-brand-600">${expense.amount.toFixed(2)}</p>
              </div>
              <p className="mt-1 text-xs text-slate-400">Paid by {expense.paidBy.name}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Settled History</h3>
        <div className="space-y-2">
          {settledRecords.length === 0 ? (
            <p className="text-sm text-slate-600">No settled payments yet.</p>
          ) : (
            settledRecords.map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                {item.fromUser.name} paid {item.toUser.name} ${item.amount.toFixed(2)}
                <span className="ml-2 text-xs text-slate-400">{new Date(item.settledAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-emerald-700">Settle Up</h3>
          <span className="rounded-full border border-emerald-500/50 px-2 py-1 text-xs text-emerald-600">Live</span>
        </div>
        <div className="space-y-2">
          {settlements.length === 0 ? (
            <p className="text-sm text-slate-600">No pending balances.</p>
          ) : (
            settlements.map((item, index) => (
              <div key={`${item.from}-${item.to}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-800">
                <span>
                  {item.from} owes {item.to} ${item.amount.toFixed(2)}
                </span>
                {currentUserId === item.toUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.fromUserId || !item.toUserId) return;
                      void onSettleExpense({
                        fromUserId: item.fromUserId,
                        toUserId: item.toUserId,
                        amount: item.amount
                      });
                    }}
                    className="rounded-md border border-emerald-500/50 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/10"
                  >
                    Mark Settled
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
