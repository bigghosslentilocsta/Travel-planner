// Requests and exports AI-generated itinerary suggestions.
import { useMemo, useState } from "react";
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
  const dayPlans = useMemo(() => itinerary?.days ?? [], [itinerary]);

  if (!tripId) return null;

  // Exports the itinerary as a structured PDF that mirrors the day-by-day preview.
  async function downloadAsPdf() {
    const safeTitle = (itinerary?.title || "AI Itinerary").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "ai-itinerary";

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const tableWidth = pageWidth - margin * 2;
    const contentWidth = tableWidth;
    let y = margin;

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const wrapLines = (text: string, width: number) => doc.splitTextToSize(text || "", width) as string[];

    const drawWrappedText = (text: string, x: number, width: number, lineHeight = 14, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = wrapLines(text, width);
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, x, y);
        y += lineHeight;
      });
    };

    const drawCell = (text: string, x: number, width: number, rowHeight: number, options?: { bold?: boolean; color?: [number, number, number] }) => {
      if (options?.bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      if (options?.color) doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      const lines = wrapLines(text, width - 8);
      const textHeight = Math.max(lines.length * 12, 12);
      const textY = y + Math.max((rowHeight - textHeight) / 2 + 8, 12);
      doc.text(lines, x + 4, textY);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
    };

    const drawRow = (cells: Array<{ text: string; width: number; bold?: boolean; color?: [number, number, number] }>, rowHeight: number, fillColor: [number, number, number] | null = null) => {
      ensureSpace(rowHeight);
      let x = margin;
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }
      doc.setDrawColor(40, 52, 70);
      cells.forEach((cell) => {
        doc.rect(x, y, cell.width, rowHeight);
        drawCell(cell.text, x, cell.width, rowHeight, { bold: cell.bold, color: cell.color });
        x += cell.width;
      });
      y += rowHeight;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(itinerary?.title || "AI Itinerary", margin, y);
    y += 22;

    if (itinerary?.summary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      drawWrappedText(itinerary.summary, margin, contentWidth, 15, 11);
      y += 6;
    }

    if (itinerary) {
      itinerary.days.forEach((day) => {
        ensureSpace(58);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 24, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(`Day ${day.dayNumber}`, margin + 8, y + 16);
        if (day.theme) {
          const themeLines = wrapLines(day.theme, contentWidth - 110);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(themeLines[0] || day.theme, margin + 72, y + 16);
        }
        doc.setTextColor(15, 23, 42);
        y += 24;

        const headerHeight = 22;
        const columnWidths = [52, 137, 100, 146, 80];
        drawRow(
          [
            { text: "Time", width: columnWidths[0], bold: true, color: [15, 23, 42] },
            { text: "Activity", width: columnWidths[1], bold: true, color: [15, 23, 42] },
            { text: "Location", width: columnWidths[2], bold: true, color: [15, 23, 42] },
            { text: "Notes", width: columnWidths[3], bold: true, color: [15, 23, 42] },
            { text: "Est. Cost", width: columnWidths[4], bold: true, color: [15, 23, 42] }
          ],
          headerHeight,
          [226, 232, 240]
        );

        day.activities.forEach((activity, index) => {
          const estimatedCostText = `Rs. ${Number(activity.estimatedCost || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
          const rowHeight = Math.max(
            26,
            ...[
              activity.time || "TBD",
              activity.activity,
              activity.location || "-",
              activity.notes || "-",
              estimatedCostText
            ].map((text, idx) => {
              const widths = columnWidths;
              return wrapLines(text, widths[idx] - 10).length * 12;
            })
          ) + 10;

          drawRow(
            [
              { text: activity.time || "TBD", width: columnWidths[0], color: [15, 23, 42] },
              { text: activity.activity, width: columnWidths[1], bold: true, color: [15, 23, 42] },
              { text: activity.location || "-", width: columnWidths[2], color: [51, 65, 85] },
              { text: activity.notes || "-", width: columnWidths[3], color: [71, 85, 105] },
              { text: estimatedCostText, width: columnWidths[4], color: [15, 23, 42] }
            ],
            rowHeight,
            index % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
          );
        });

        y += 14;
      });
    } else if (result) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(226, 232, 240);
      doc.text("AI Itinerary", margin, y);
      y += 24;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(203, 213, 225);
      drawWrappedText(result, margin, contentWidth, 15, 11);
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
            {dayPlans.map((day) => (
              <div key={day.dayNumber} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/40">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-100">Day {day.dayNumber}</h5>
                    {day.theme && <p className="mt-1 text-xs text-slate-400">{day.theme}</p>}
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                    {day.activities.length} activities
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                    <thead className="text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">Time</th>
                        <th className="px-4 py-3 font-medium">Activity</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Notes</th>
                        <th className="px-4 py-3 font-medium">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-100">
                      {day.activities.map((activity, index) => (
                        <tr key={`${day.dayNumber}-${activity.time}-${index}`} className="odd:bg-slate-900/30 even:bg-slate-950/10">
                          <td className="px-4 py-3 align-top text-slate-300">{activity.time || "TBD"}</td>
                          <td className="px-4 py-3 align-top font-medium text-indigo-100">{activity.activity}</td>
                          <td className="px-4 py-3 align-top text-slate-300">{activity.location || "-"}</td>
                          <td className="px-4 py-3 align-top text-slate-400">{activity.notes || "-"}</td>
                          <td className="px-4 py-3 align-top text-emerald-200">₹{Number(activity.estimatedCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !itinerary && (
        <div className="mt-3 rounded-md border border-slate-700 bg-slate-900/60 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">AI response</p>
          <p className="text-sm leading-6 text-slate-300">
            The AI reply could not be parsed into the itinerary table. Try generating again, or copy the response below.
          </p>
          <button
            type="button"
            onClick={downloadAsPdf}
            className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Download PDF
          </button>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-100">{result}</pre>
        </div>
      )}
    </div>
  );
}
