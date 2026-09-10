// Chooses the auth or dashboard view based on the current route and token.
import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, MapPinned } from "lucide-react";
import { Sidebar, type SidebarSection } from "./components/layout/Sidebar";
import { AuthPage } from "./pages/AuthPage";
import { TripDashboardPage } from "./pages/TripDashboardPage";

const ROUTE_TO_SECTION: Record<string, SidebarSection> = {
  "/": "trips",
  "/dashboard": "trips",
  "/trips": "trips",
  "/itinerary": "itinerary",
  "/expenses": "expenses"
};

const wrongDestinationImage = "/wrong-destination-bones.png";

// Removes trailing slashes so route checks stay stable.
function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

// Chooses which screen to show for the current route and auth state.
function resolveView(pathname: string, token: string) {
  const normalized = normalizePathname(pathname);
  const section = ROUTE_TO_SECTION[normalized];

  if (!token) {
    return normalized === "/" ? "auth" : "auth";
  }

  return section ? "dashboard" : "not-found";
}

// Orchestrates auth, routing, and the dashboard shell.
function App() {
  const [token, setToken] = useState(() => localStorage.getItem("tp_token") || "");
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));
  const [activeSection, setActiveSection] = useState<SidebarSection>(() => ROUTE_TO_SECTION[normalizePathname(window.location.pathname)] || "trips");

  const viewMode = resolveView(pathname, token);

  useEffect(() => {
    // Keeps local route state in sync with browser navigation.
    const handlePopState = () => {
      const nextPath = normalizePathname(window.location.pathname);
      setPathname(nextPath);
      setActiveSection(ROUTE_TO_SECTION[nextPath] || "trips");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!token && pathname !== "/") {
      window.history.replaceState({}, "", "/");
      setPathname("/");
      setActiveSection("trips");
    }
  }, [token, pathname]);

  // Stores the session token after a successful login.
  function handleAuthenticated(nextToken: string) {
    setToken(nextToken);
  }

  // Clears the session and sends the user back to auth.
  function handleLogout() {
    localStorage.removeItem("tp_token");
    setToken("");
    window.history.replaceState({}, "", "/");
    setPathname("/");
    setActiveSection("trips");
  }

  // Moves the dashboard view to the selected section.
  function navigateTo(section: SidebarSection) {
    const nextPath = section === "trips" ? "/trips" : section === "itinerary" ? "/itinerary" : "/expenses";
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
    setActiveSection(section);
  }

  return (
    <>
      {viewMode === "auth" ? (
        <AuthPage onAuthenticated={handleAuthenticated} />
      ) : (
        <div className="min-h-screen md:flex">
          <Sidebar
            activeSection={activeSection}
            onNavigate={navigateTo}
          />

          <div className="relative z-10 flex-1">
            {/* Animated background */}
            <div className="animated-bg">
              <div className="blob blob-1" />
              <div className="blob blob-2" />
              <div className="blob blob-3" />
            </div>

            <div className="relative z-10 pb-20 md:pb-8">
              {viewMode === "not-found" ? (
                <main className="flex min-h-screen items-center justify-center p-6">
                  <div className="glass-card max-w-lg p-8 text-center shadow-soft">
                    <p className="text-xs uppercase tracking-[0.3em] text-coral-500">Oops</p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-800">Wrong destination</h1>
                    <img
                      src={wrongDestinationImage}
                      alt="Human bones illustration"
                      className="mx-auto mt-6 max-h-72 w-full max-w-md object-contain"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      The page you requested does not exist. Go back to the main dashboard to continue.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo("trips")}
                      className="mt-6 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-brand-600 transition-colors"
                    >
                      Main Dashboard
                    </button>
                  </div>
                </main>
              ) : (
                <TripDashboardPage token={token} onLogout={handleLogout} activeSection={activeSection} />
              )}
            </div>
          </div>

          {/* Mobile bottom navigation — only visible below the md breakpoint */}
          <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-brand-500/20 md:hidden" style={{ backgroundColor: "var(--sidebar-bg)" }}>
            {([
              { label: "Trips", icon: MapPinned, section: "trips" as SidebarSection },
              { label: "Itinerary", icon: CalendarDays, section: "itinerary" as SidebarSection },
              { label: "Split", icon: CircleDollarSign, section: "expenses" as SidebarSection }
            ]).map(({ label, icon: Icon, section }) => {
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => navigateTo(section)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                    isActive ? "text-brand-200 text-white" : "text-brand-200/60"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-teal-300" : "text-brand-300/60"} />
                  <span>{label}</span>
                  {isActive && <span className="h-1 w-6 rounded-full bg-teal-400" />}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

export default App;
