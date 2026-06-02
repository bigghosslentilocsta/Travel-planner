// Chooses the auth or dashboard view based on the current route and token.
import { useEffect, useState } from "react";
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
  const [darkMode, setDarkMode] = useState(true);
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
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((current) => !current)}
            activeSection={activeSection}
            onNavigate={navigateTo}
          />

          <div className="flex-1">
            {viewMode === "not-found" ? (
              <main className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-lg rounded-3xl border border-slate-700 bg-slate-900/70 p-8 text-center shadow-glow">
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Oops</p>
                  <h1 className="mt-3 text-3xl font-semibold text-slate-100">Wrong destination</h1>
                  <img
                    src={wrongDestinationImage}
                    alt="Human bones illustration"
                    className="mx-auto mt-6 max-h-72 w-full max-w-md object-contain"
                  />
                  <p className="mt-3 text-sm text-slate-300">
                    The page you requested does not exist. Go back to the main dashboard to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo("trips")}
                    className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
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
      )}
    </>
  );
}

export default App;
