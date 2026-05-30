import { CalendarDays, CircleDollarSign, MapPinned, Moon, Sun } from "lucide-react";

export type SidebarSection = "trips" | "itinerary" | "expenses";

type SidebarProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
};

const navItems = [
  { label: "Trips", icon: MapPinned },
  { label: "Itinerary", icon: CalendarDays },
  { label: "Expense Split", icon: CircleDollarSign }
];

export function Sidebar({ darkMode, onToggleDarkMode, activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-700/40 bg-slate-950/70 p-4 backdrop-blur-xl">
      <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-indigo-200 shadow-glow">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Collaborative</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Travel Planner</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ label, icon: Icon }, index) => {
          const section = (index === 0 ? "trips" : index === 1 ? "itinerary" : "expenses") as SidebarSection;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(section)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                activeSection === section
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-100"
                  : "border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggleDarkMode}
        className="mt-auto flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-200"
      >
        <span>{darkMode ? "Dark mode" : "Light mode"}</span>
        {darkMode ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </aside>
  );
}
