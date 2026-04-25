import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

const SYSTEM_PROMPT = `You extract structured session data from informal WhatsApp announcements for an MBA cohort at ISB (Indian School of Business). Today is ${today} (Asia/Kolkata timezone).

Return ONLY raw valid JSON — no prose, no markdown fences:
{
  "title": string,
  "description": string,
  "starts_at": "ISO-8601 timestamp in Asia/Kolkata timezone — infer from words like tonight/tomorrow/9PM",
  "venue": string,
  "tags": ["subset of: product, consulting, tech, careers, academics, social"]
}

Rules: use empty string for unknown text fields, empty array for unknown tags.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return json({ error: "text is required (min 10 chars)" }, 400);
    }

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://pulse-isb.vercel.app",
        "X-Title": "Pulse ISB",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        temperature: 0.1,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 2000) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `OpenRouter error: ${errText}` }, 500);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "could not extract JSON from model response" }, 500);

    return json(JSON.parse(match[0]));
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
