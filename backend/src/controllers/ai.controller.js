function resolveTextApiUrl(apiKey) {
  // Picks the provider URL from env or API key format.
  if (process.env.TEXT_LLM_API_URL) return process.env.TEXT_LLM_API_URL;
  // Groq keys typically start with gsk_ and use OpenAI-compatible endpoints.
  if (typeof apiKey === "string" && apiKey.startsWith("gsk_")) {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
  return "https://api.openai.com/v1/chat/completions";
}

// Normalizes different provider response shapes into plain text.
function extractTextFromProviderResponse(data) {
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || "";
  }
  if (data.choices && data.choices[0] && data.choices[0].text) {
    return data.choices[0].text || "";
  }
  if (data.output && Array.isArray(data.output)) {
    return data.output.map((o) => o.content || "").join("\n");
  }
  return JSON.stringify(data);
}

// Converts model output into the itinerary object expected by the UI.
function tryParseItinerary(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  const blockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = blockMatch ? blockMatch[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.days)) return null;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "AI Itinerary",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      days: parsed.days
        .map((day, index) => ({
          dayNumber: Number(day.dayNumber) || index + 1,
          theme: typeof day.theme === "string" ? day.theme : "",
          activities: Array.isArray(day.activities)
            ? day.activities.map((activity) => ({
                time: typeof activity.time === "string" ? activity.time : "TBD",
                activity: typeof activity.activity === "string" ? activity.activity : "Activity",
                location: typeof activity.location === "string" ? activity.location : "",
                notes: typeof activity.notes === "string" ? activity.notes : "",
                estimatedCost: Number(activity.estimatedCost) || 0
              }))
            : []
        }))
        .filter((day) => day.activities.length > 0)
    };
  } catch {
    return null;
  }
}

// Requests an itinerary suggestion from the configured LLM.
export async function suggestItinerary(req, res, next) {
  try {
    const { tripId } = req.params;
    const { destination, days = 3, preferences = "" } = req.body || {};

    const apiKey = process.env.TEXT_LLM_API_KEY;
    const model = process.env.TEXT_LLM_MODEL || "gpt-4o";

    if (!apiKey) return res.status(500).json({ message: "Text LLM API key is not configured" });

    if (!destination || typeof destination !== "string") {
      return res.status(400).json({ message: "Destination is required" });
    }

    const textApiUrl = resolveTextApiUrl(apiKey);

    const prompt = `You are an expert travel planner. Create a ${days}-day itinerary for ${destination}. Preferences: ${preferences}.

Return ONLY valid JSON using this exact shape:
{
  "title": "string",
  "summary": "string",
  "days": [
    {
      "dayNumber": 1,
      "theme": "string",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "string",
          "location": "string",
          "notes": "string",
          "estimatedCost": 0
        }
      ]
    }
  ]
}

Rules:
- Keep activities practical and local.
- 3 to 5 activities per day.
- Use concise language.
- Do not include markdown or backticks.`;

    const payload = {
      model,
      messages: [{ role: "system", content: "You are a helpful travel planner." }, { role: "user", content: prompt }],
      max_tokens: 1400,
      temperature: 0.8
    };

    const resp = await fetch(textApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({
        message: "LLM request failed",
        providerStatus: resp.status,
        providerUrl: textApiUrl,
        details: text.slice(0, 1200)
      });
    }

    const data = await resp.json();
    const text = extractTextFromProviderResponse(data);
    const itinerary = tryParseItinerary(text);

    res.json({ suggestion: text, itinerary });
  } catch (err) {
    next(err);
  }
}
