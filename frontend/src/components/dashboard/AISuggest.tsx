// Requests and exports AI-generated itinerary suggestions.
import { useState } from "react";
import { jsPDF } from "jspdf";
import { apiFetch } from "../../api/client";

type GeneratedItinerary = {
  title: string;
  summary: string;
  days: {
    dayNumber: number;
    theme: string;
    activities: {
      time: string;
      activity: string;
      location: string;
      notes: string;
      estimatedCost: number;
    }[];
  }[];
};

// Parses model output into the itinerary shape used by the UI.
function parseItineraryFromText(value: string | null): GeneratedItinerary | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  const blockMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = blockMatch ? blockMatch[1].trim() : raw;

  // Tries a strict JSON parse first.
  const tryParse = (candidate: string) => {
    const parsed = JSON.parse(candidate);
    if (!parsed || !Array.isArray(parsed.days)) return null;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "AI Itinerary",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      days: parsed.days
        .map((day: any, index: number) => ({
          dayNumber: Number(day.dayNumber) || index + 1,
          theme: typeof day.theme === "string" ? day.theme : "",
          activities: Array.isArray(day.activities)
            ? day.activities.map((activity: any) => ({
                time: typeof activity.time === "string" ? activity.time : "TBD",
                activity: typeof activity.activity === "string" ? activity.activity : "Activity",
                location: typeof activity.location === "string" ? activity.location : "",
                notes: typeof activity.notes === "string" ? activity.notes : "",
                estimatedCost: Number(activity.estimatedCost) || 0
              }))
            : []
        }))
        .filter((d: any) => d.activities.length > 0)
    };
  };

  try {
    return tryParse(jsonText);
  } catch {
    // Recover partially-truncated JSON by trimming incomplete tail
    // and auto-closing brackets/braces for best-effort rendering.
    try {
      const lastBrace = jsonText.lastIndexOf("}");
      if (lastBrace <= 0) return null;

      let repaired = jsonText.slice(0, lastBrace + 1).replace(/,\s*([}\]])/g, "$1");

      const openCurly = (repaired.match(/\{/g) || []).length;
      const closeCurly = (repaired.match(/\}/g) || []).length;
      const openSquare = (repaired.match(/\[/g) || []).length;
      const closeSquare = (repaired.match(/\]/g) || []).length;

      if (openSquare > closeSquare) repaired += "]".repeat(openSquare - closeSquare);
      if (openCurly > closeCurly) repaired += "}".repeat(openCurly - closeCurly);

      return tryParse(repaired);
    } catch {
      return null;
    }
  }
}

// Requests and exports AI-generated itinerary suggestions.
export function AISuggest({ tripId, token, destination }: { tripId: string | null; token: string | null; destination?: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [open, setOpen] = useState(false);
  const [destInput, setDestInput] = useState(destination || "");
  const [daysInput, setDaysInput] = useState(3);
  const [prefsInput, setPrefsInput] = useState("");

  if (!tripId) return null;

  // Exports the generated itinerary as a PDF file.
  function downloadAsPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxTextWidth = pageWidth - margin * 2;
    let y = margin;

    // Adds a new page when the PDF content runs low on space.
    const ensureSpace = (requiredHeight = 18) => {
      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Writes wrapped paragraphs into the PDF.
    const writeWrapped = (text: string, fontSize = 11, lineHeight = 16) => {
      const lines = doc.splitTextToSize(text, maxTextWidth);
      doc.setFontSize(fontSize);
      lines.forEach((line: string) => {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
    };

    const safeTitle = (itinerary?.title || "AI Itinerary").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "ai-itinerary";

    if (itinerary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(itinerary.title || "AI Itinerary", margin, y);
      y += 28;

      if (itinerary.summary) {
        doc.setFont("helvetica", "normal");
        writeWrapped(itinerary.summary, 11, 16);
        y += 8;
      }

      itinerary.days.forEach((day) => {
        ensureSpace(24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        const dayTitle = day.theme ? `Day ${day.dayNumber}: ${day.theme}` : `Day ${day.dayNumber}`;
        doc.text(dayTitle, margin, y);
        y += 20;

        day.activities.forEach((activity) => {
          doc.setFont("helvetica", "bold");
          writeWrapped(`${activity.time} - ${activity.activity}`, 11, 15);
          doc.setFont("helvetica", "normal");
          if (activity.location) writeWrapped(`Location: ${activity.location}`, 10, 14);
          if (activity.notes) writeWrapped(`Note: ${activity.notes}`, 10, 14);
          writeWrapped(`Estimated Cost: $${Number(activity.estimatedCost || 0).toFixed(2)}`, 10, 14);
          y += 6;
        });

        y += 4;
      });
    } else if (result) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("AI Itinerary", margin, y);
      y += 24;
      doc.setFont("helvetica", "normal");
      writeWrapped(result, 11, 16);
    } else {
      return;
    }

    doc.save(`${safeTitle}.pdf`);
  }

  // Requests a fresh AI itinerary from the backend.
  async function handleSuggest() {
    const dest = destInput.trim();
    if (!dest) {
      setResult("Please enter a destination.");
      return;
    }

    const days = Math.max(1, Number(daysInput) || 1);
    const prefs = prefsInput.trim();

    setLoading(true);
    try {
      const resp = await apiFetch<{ suggestion?: string; itinerary?: GeneratedItinerary | null }>(
        `/trips/${tripId}/ai/itinerary`,
        { method: "POST", body: JSON.stringify({ destination: dest, days, preferences: prefs }) },
        token || undefined
      );
      const suggestionText = resp.suggestion || "";
      setResult(suggestionText);
      setItinerary(resp.itinerary || parseItineraryFromText(suggestionText));
      setOpen(false);
    } catch (err: any) {
      setItinerary(null);
      setResult(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          setDestInput((prev) => prev || destination || "");
          setOpen((prev) => !prev);
        }}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        {open ? "Close AI Planner" : "Suggest Itinerary (AI)"}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4">
          <p className="mb-3 text-sm font-medium text-emerald-200">Tell AI your trip preferences</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-300">Destination</label>
              <input
                value={destInput}
                onChange={(event) => setDestInput(event.target.value)}
                placeholder="e.g., Paris"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-300">Days</label>
              <input
                type="number"
                min={1}
                max={30}
                value={daysInput}
                onChange={(event) => setDaysInput(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-300">Preferences</label>
              <input
                value={prefsInput}
                onChange={(event) => setPrefsInput(event.target.value)}
                placeholder="museums, food, outdoors"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-800"
            >
              {loading ? "Generating..." : "Generate Plan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDestInput(destination || "");
                setDaysInput(3);
                setPrefsInput("");
              }}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {itinerary && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-emerald-200">{itinerary.title || "AI Itinerary"}</h4>
            <button
              type="button"
              onClick={downloadAsPdf}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
            >
              Download PDF
            </button>
          </div>
          {itinerary.summary && <p className="mt-1 text-sm leading-6 text-slate-300">{itinerary.summary}</p>}

          <div className="mt-4 space-y-4">
            {itinerary.days.map((day) => (
              <div key={day.dayNumber} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold text-slate-100">Day {day.dayNumber}</h5>
                  {day.theme && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">{day.theme}</span>}
                </div>

                <div className="mt-3 space-y-2">
                  {day.activities.map((activity, index) => (
                    <div key={`${day.dayNumber}-${index}`} className="rounded-lg border border-slate-700/80 bg-slate-800/40 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h6 className="font-medium text-indigo-200">{activity.time} • {activity.activity}</h6>
                        <span className="text-xs text-emerald-200">Approx ${Number(activity.estimatedCost || 0).toFixed(0)}</span>
                      </div>
                      {activity.location && <p className="mt-1 text-xs text-slate-300">• Location: {activity.location}</p>}
                      {activity.notes && <p className="mt-1 text-xs leading-5 text-slate-400">• Note: {activity.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !itinerary && (
        <div className="mt-3 rounded-md bg-slate-900/60 p-3">
          <button
            type="button"
            onClick={downloadAsPdf}
            className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Download PDF
          </button>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-100">{result}</pre>
        </div>
      )}
    </div>
  );
}
