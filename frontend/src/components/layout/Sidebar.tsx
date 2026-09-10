// Renders the main navigation panel with a solid, consistent background.
import { CalendarDays, CircleDollarSign, MapPinned } from "lucide-react";

export type SidebarSection = "trips" | "itinerary" | "expenses";

type SidebarProps = {
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
};

const navItems = [
  { label: "Trips", icon: MapPinned },
  { label: "Itinerary", icon: CalendarDays },
  { label: "Expense Split", icon: CircleDollarSign }
];

// Solid indigo sidebar — always the same color, unaffected by the animated background.
export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="relative z-20 hidden md:flex md:w-64 flex-col border-r border-brand-500/20 p-5" style={{ backgroundColor: "var(--sidebar-bg)" }}>
      {/* Logo / branding */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300">Collaborative</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Travel Planner</h1>
      </div>

      {/* Navigation links */}
      <nav className="space-y-2">
        {navItems.map(({ label, icon: Icon }, index) => {
          const section = (index === 0 ? "trips" : index === 1 ? "itinerary" : "expenses") as SidebarSection;
          const isActive = activeSection === section;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(section)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-white shadow-md"
                  : "text-brand-200/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-brand-300/60"} />
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
