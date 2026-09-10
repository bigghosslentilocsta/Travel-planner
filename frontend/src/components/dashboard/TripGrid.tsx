// Shows a full-width destination banner carousel, trip cards, and create/join controls.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePlannerStore } from "../../store/usePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Compass, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import type { Trip } from "../../types";

type TripGridProps = {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (payload: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    invitedEmails: string[];
  }) => Promise<void>;
  onJoinTrip: (payload: { tripName: string; tripCode: string }) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
};

type Region = "north" | "south" | "east" | "west" | "northeast" | "central";

function detectRegionFromCoords(lat: number, lng: number): Region {
  if (lat > 26 && lng > 72 && lng < 92) return "north";
  if (lat < 16 && lng > 74 && lng < 80) return "south";
  if (lat > 20 && lng > 86) return "east";
  if (lat > 17 && lat < 26 && lng < 74) return "west";
  if (lat > 22 && lng > 89) return "northeast";
  return "central";
}

type Destination = {
  name: string;
  image: string;
  description: string;
  region: Region[];
};
const SEASONAL_DESTINATIONS: Record<string, Destination[]> = {
  monsoon: [
    { name: "Munnar, Kerala", image: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=1200&h=800&fit=crop", description: "Lush tea plantations draped in monsoon mist — the perfect cool escape.", region: ["south"] },
    { name: "Coorg, Karnataka", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop", description: "Rolling coffee estates come alive during the rains.", region: ["south"] },
    { name: "Lonavala, Maharashtra", image: "https://images.unsplash.com/photo-1609766934003-0861547700c9?w=1200&h=800&fit=crop", description: "Dramatic waterfalls and emerald-green valleys near Mumbai.", region: ["west", "central"] },
    { name: "Shillong, Meghalaya", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&h=800&fit=crop", description: "The Scotland of the East with breathtaking living root bridges.", region: ["northeast", "east"] },
    { name: "Wayanad, Kerala", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=60", description: "Misty forests and spice plantations wrapped in clouds.", region: ["south"] },
    { name: "Udaipur, Rajasthan", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop", description: "The City of Lakes fills to the brim with vivid green hills.", region: ["north", "west"] },
    { name: "Valparai, Tamil Nadu", image: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=1200&h=800&fit=crop&q=90", description: "Tea estates and wildlife best explored in the rains.", region: ["south"] },
    { name: "Cherrapunji, Meghalaya", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&h=800&fit=crop", description: "One of the wettest places with dramatic cliffside waterfalls.", region: ["northeast", "east"] }
  ],
  autumn: [
    { name: "Jaipur, Rajasthan", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&h=800&fit=crop", description: "Post-monsoon clarity reveals the Pink City — ideal for fort-hopping.", region: ["north", "west"] },
    { name: "Varanasi, UP", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&h=800&fit=crop", description: "The spiritual capital glows during Dev Deepawali festival.", region: ["north", "east", "central"] },
    { name: "Rishikesh, Uttarakhand", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=75", description: "Perfect weather for yoga retreats and river rafting.", region: ["north"] },
    { name: "Darjeeling, West Bengal", image: "https://images.unsplash.com/photo-1544634076-a90160ddf44e?w=1200&h=800&fit=crop", description: "Clear skies offer spectacular Kanchenjunga views.", region: ["east", "northeast"] },
    { name: "Udaipur, Rajasthan", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop", description: "Lakes full and palaces shimmer in golden light.", region: ["west", "north"] },
    { name: "Khajuraho, MP", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=800&fit=crop", description: "Comfortable temps for UNESCO temples exploration.", region: ["central", "north"] }
  ],
  winter: [
    { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&h=800&fit=crop", description: "Peak beach season with sun-drenched shores and vibrant nightlife.", region: ["west", "south"] },
    { name: "Manali, HP", image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=1200&h=800&fit=crop", description: "Snow-capped peaks and cozy mountain cafes for a winter escape.", region: ["north"] },
    { name: "Auli, Uttarakhand", image: "https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=1200&h=800&fit=crop", description: "India's premier skiing with powdery slopes and Nanda Devi views.", region: ["north"] },
    { name: "Andaman Islands", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop", description: "Crystal-clear waters ideal for scuba diving and snorkeling.", region: ["south"] },
    { name: "Kutch, Gujarat", image: "https://images.unsplash.com/photo-1609948543919-ea64422385cd?w=1200&h=800&fit=crop", description: "The Rann Utsav transforms the white desert into a vibrant carnival.", region: ["west"] },
    { name: "Pondicherry", image: "https://images.unsplash.com/photo-1586526399012-e7658a8f6e94?w=1200&h=800&fit=crop", description: "Cool breezes and French colonial charm for a leisurely escape.", region: ["south"] }
  ],
  summer: [
    { name: "Shimla, HP", image: "https://images.unsplash.com/photo-1597075240227-02773a10177a?w=1200&h=800&fit=crop", description: "The Queen of Hills with cool mountain air and colonial charm.", region: ["north"] },
    { name: "Nainital, Uttarakhand", image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1200&h=800&fit=crop", description: "Serene lake surrounded by pine forests, perfect for boating.", region: ["north"] },
    { name: "Kodaikanal, TN", image: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=1200&h=800&fit=crop&q=82", description: "Cool misty mornings, flower-carpeted meadows, and a beautiful lake.", region: ["south"] },
    { name: "Ooty, Tamil Nadu", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=88", description: "Toy train rides through Nilgiri hills with pleasant weather.", region: ["south"] },
    { name: "Mahabaleshwar, MH", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=92", description: "Strawberry picking season with cool breezes and green plateaus.", region: ["west"] },
    { name: "Mcleodganj, HP", image: "https://images.unsplash.com/photo-1571401835393-8c5f35422b6c?w=1200&h=800&fit=crop", description: "Tibetan culture, trekking trails, and Dhauladhar mountain views.", region: ["north"] }
  ]
};

function getSeasonKey(): string {
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) return "monsoon";
  if (month >= 9 && month <= 10) return "autumn";
  if (month === 11 || month <= 1) return "winter";
  return "summer";
}

function getSeasonLabel(key: string): string {
  const map: Record<string, string> = { monsoon: "Monsoon", autumn: "Autumn", winter: "Winter", summer: "Summer" };
  return map[key] || "";
}

/* ─── Main Component ─── */
export function TripGrid({ trips, selectedTripId, onSelectTrip, onCreateTrip, onJoinTrip, onDeleteTrip: _onDeleteTrip }: TripGridProps) {
  const { onlineMembers } = usePlannerStore();
  const seasonKey = useMemo(() => getSeasonKey(), []);
  const allDestinations = useMemo(() => SEASONAL_DESTINATIONS[seasonKey] || [], [seasonKey]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserRegion(detectRegionFromCoords(pos.coords.latitude, pos.coords.longitude)),
      () => { /* denied */ },
      { timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  const destinations = useMemo(() => {
    if (!userRegion) return allDestinations;
    const near = allDestinations.filter((d) => d.region.includes(userRegion));
    const far = allDestinations.filter((d) => !d.region.includes(userRegion));
    return [...near, ...far];
  }, [allDestinations, userRegion]);
  /* Carousel state */
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback((index: number, dir: number) => {
    if (isTransitioning) return;
    setDirection(dir);
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % destinations.length, 1);
  }, [currentSlide, destinations.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + destinations.length) % destinations.length, -1);
  }, [currentSlide, destinations.length, goToSlide]);

  useEffect(() => {
    if (destinations.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
      setDirection(1);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [destinations.length]);

  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
      setDirection(1);
    }, 5000);
  }, [destinations.length]);

  const handleNext = useCallback(() => { nextSlide(); resetAutoSlide(); }, [nextSlide, resetAutoSlide]);
  const handlePrev = useCallback(() => { prevSlide(); resetAutoSlide(); }, [prevSlide, resetAutoSlide]);

  /* Click-to-fill: opens create form with destination pre-filled */
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleBannerClick = useCallback(() => {
    const dest = destinations[currentSlide];
    if (!dest) return;
    setDestination(dest.name);
    setShowCreateForm(true);
    setFormError("");
  }, [destinations, currentSlide]);

  /* Join trip form state */
  const [joinTripName, setJoinTripName] = useState("");
  const [joinTripCode, setJoinTripCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  /* Date validation */
  function validateDates(start: string, end: string): string | null {
    if (!start || !end) return "Please select both start and end dates.";
    if (new Date(end) < new Date(start)) return "End date must be on or after the start date.";
    return null;
  }

  /* Overlap check (client-side) */
  function checkOverlap(start: string, end: string): string | null {
    if (!start || !end) return null;
    const ns = new Date(start);
    const ne = new Date(end);
    for (const trip of trips) {
      const es = new Date(trip.startDate);
      const ee = new Date(trip.endDate);
      if (ns <= ee && es <= ne) {
        return `This trip overlaps with "${trip.title}" (${new Date(trip.startDate).toLocaleDateString()} – ${new Date(trip.endDate).toLocaleDateString()}). Please choose non-overlapping dates.`;
      }
    }
    return null;
  }
  /* Create trip submit */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!title.trim() || !destination.trim() || !startDate || !endDate) {
      setFormError("Please fill in all required fields.");
      return;
    }
    const dateError = validateDates(startDate, endDate);
    if (dateError) { setFormError(dateError); return; }
    const overlapError = checkOverlap(startDate, endDate);
    if (overlapError) { setFormError(overlapError); return; }
    setSubmitting(true);
    try {
      await onCreateTrip({ title: title.trim(), destination: destination.trim(), startDate, endDate, invitedEmails: [] });
      setTitle(""); setDestination(""); setStartDate(""); setEndDate(""); setShowCreateForm(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to create trip.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinSubmit(event: FormEvent) {
    event.preventDefault();
    setJoinError("");
    if (!joinTripName.trim() || !joinTripCode.trim()) { setJoinError("Please enter both trip name and code."); return; }
    setJoining(true);
    try {
      await onJoinTrip({ tripName: joinTripName.trim(), tripCode: joinTripCode.trim() });
      setJoinTripName(""); setJoinTripCode("");
    } catch (err: any) {
      setJoinError(err?.message || "Failed to join trip.");
    } finally {
      setJoining(false);
    }
  }

  const currentDest = destinations[currentSlide];

  return (
    <section className="space-y-6">
      {/* Full-Width Destination Banner Carousel */}
      {destinations.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl shadow-soft" style={{ minHeight: "340px" }}>
          <div className="relative h-[340px] cursor-pointer overflow-hidden rounded-2xl md:h-[420px]" onClick={handleBannerClick}>
            <AnimatePresence mode="popLayout" initial={false}>
              {currentDest && (
                <motion.div key={currentDest.name} initial={{ opacity: 0, x: direction * 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -80 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="absolute inset-0 flex flex-col md:flex-row">
                  <div className="relative h-full w-full md:w-1/2">
                    <img src={currentDest.image} alt={currentDest.name} className="h-full w-full object-cover" loading="eager" />
                    <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-black/20 md:block" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 md:hidden" />
                  </div>
                  <div className="flex w-full flex-col justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:w-1/2 md:p-10">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-block rounded-full bg-brand-400/20 px-3 py-1 text-xs font-semibold text-brand-300">{getSeasonLabel(seasonKey)} Pick</span>
                      {userRegion && <span className="inline-block rounded-full bg-teal-400/20 px-3 py-1 text-xs font-semibold text-teal-300">Near You</span>}
                    </div>
                    <h2 className="text-3xl font-bold text-white md:text-4xl">{currentDest.name}</h2>
                    <p className="mt-4 text-base leading-relaxed text-brand-200/80 md:text-lg">{currentDest.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-brand-300/60"><Compass size={16} /><span>Click anywhere to plan a trip here</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {destinations.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"><ChevronLeft size={20} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"><ChevronRight size={20} /></button>
              </>
            )}
            {destinations.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-6">
                {destinations.map((_, i) => (
                  <button key={i} type="button" onClick={(e) => { e.stopPropagation(); goToSlide(i, i > currentSlide ? 1 : -1); resetAutoSlide(); }}
                    className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Trip list */}
      <div>
        <div className="mb-4"><h2 className="text-lg font-semibold text-slate-800">Your Trips</h2></div>
        {trips.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
            <Compass size={40} className="mx-auto mb-3 text-brand-400" />
            <p className="text-sm text-slate-500">No trips yet. Click the banner above or create a new trip below!</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const isSelected = trip._id === selectedTripId;
              const members = trip.members || [];
              const online = onlineMembers[trip._id] || [];
              return (
                <motion.button key={trip._id} type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} onClick={() => onSelectTrip(trip._id)}
                  className={`glass-card group relative overflow-hidden p-5 text-left transition-all duration-200 ${isSelected ? "ring-2 ring-brand-500 shadow-glow" : "hover:shadow-card"}`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div><h3 className="font-semibold text-slate-800">{trip.title}</h3><p className="mt-0.5 text-xs text-slate-400">{trip.destination}</p></div>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <div className="mb-3 text-xs text-slate-400">{new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((m) => (<div key={m._id} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-[10px] font-semibold text-brand-600" title={m.name || m.email}>{(m.name || m.email || "?")[0].toUpperCase()}</div>))}
                      {members.length > 4 && <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-500">+{members.length - 4}</div>}
                    </div>
                    {online.length > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">{online.length} online</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
      {/* Create / Join actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          {!showCreateForm ? (
            <button type="button" onClick={() => { setShowCreateForm(true); setFormError(""); }} className="glass-card flex w-full items-center gap-3 p-5 text-left transition-all duration-200 hover:shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10"><PlusCircle size={20} className="text-brand-500" /></div>
              <div><h3 className="font-semibold text-slate-800">Create New Trip</h3><p className="text-xs text-slate-400">Plan a new adventure with friends</p></div>
            </button>
          ) : (
            <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700"><PlusCircle size={18} className="text-brand-500" /><h3 className="font-semibold">Create New Trip</h3></div>
                <button type="button" onClick={() => setShowCreateForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
              </div>
              {formError && <p className="mb-3 flex items-start gap-2 rounded-lg bg-coral-500/10 px-3 py-2.5 text-xs text-coral-600"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{formError}</span></p>}
              <div className="grid gap-3 md:grid-cols-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Trip title" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
                <input value={destination} onChange={(e) => setDestination(e.target.value)} required placeholder="Destination" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
                <input value={startDate} onChange={(e) => setStartDate(e.target.value)} required type="date" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
                <div>
                  <input value={endDate} onChange={(e) => setEndDate(e.target.value)} required type="date" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
                  {startDate && endDate && new Date(endDate) < new Date(startDate) && <p className="mt-1 text-[11px] text-coral-500">End date must be on or after start date</p>}
                </div>

              </div>
              <button type="submit" disabled={submitting} className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-50">{submitting ? "Saving..." : "Save Trip"}</button>
            </motion.form>
          )}
        </div>
        <form onSubmit={handleJoinSubmit} className="glass-card p-5">
          <div className="mb-3"><h3 className="font-semibold text-slate-700">Join Trip</h3></div>
          {joinError && <p className="mb-3 flex items-start gap-2 rounded-lg bg-coral-500/10 px-3 py-2.5 text-xs text-coral-600"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{joinError}</span></p>}
          <div className="grid gap-3">
            <input value={joinTripName} onChange={(e) => setJoinTripName(e.target.value)} required placeholder="Trip name" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
            <input value={joinTripCode} onChange={(e) => setJoinTripCode(e.target.value.toUpperCase())} required placeholder="Trip code" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm uppercase tracking-[0.2em] text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
          </div>
          <p className="mt-2 text-xs text-slate-400">Ask your friend for the exact trip name and code.</p>
          <button type="submit" disabled={joining} className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-50">{joining ? "Joining..." : "Join Trip"}</button>
        </form>
      </div>
    </section>
  );
}