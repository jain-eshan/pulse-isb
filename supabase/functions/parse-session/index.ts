import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You extract structured session data from informal WhatsApp announcements for an MBA cohort at ISB (Indian School of Business).

Return STRICT JSON matching this schema — no prose, no markdown fences, just raw valid JSON:
{
  "title": string,
  "description": string,
  "starts_at": ISO-8601 string (assume Asia/Kolkata timezone; infer from context like "tonight", "tomorrow", etc.),
  "venue": string,
  "tags": string[]
}

Rules:
- tags must only use values from this list: ["product","consulting","tech","careers","academics","social"]
- If a field cannot be determined, use empty string or empty array.
- starts_at must always be a valid ISO-8601 timestamp.
- Today's date is ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return json({ error: "text is required (min 10 chars)" }, 400);
    }

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: text.slice(0, 2000) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `Gemini error: ${errText}` }, 500);
    }

    const geminiResponse = await res.json();
    const raw = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return json({ error: "could not extract JSON from model response" }, 500);
    }

    const parsed = JSON.parse(match[0]);
    return json(parsed);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "content-type": "application/json" },
  });
}

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };
}
