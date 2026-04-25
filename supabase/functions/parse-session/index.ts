import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const SYSTEM_PROMPT = `You extract structured session data from informal WhatsApp announcements for an MBA cohort at ISB (Indian School of Business).

Return STRICT JSON matching this schema — no prose, no markdown, just valid JSON:
{
  "title": string,
  "description": string,
  "starts_at": ISO-8601 string (assume Asia/Kolkata timezone; infer from context like "tonight", "tomorrow", etc.),
  "venue": string,
  "tags": string[]   // subset of: ["product","consulting","tech","careers","academics","social"]
}

Rules:
- If a field cannot be determined, use empty string or empty array.
- tags must only use values from the allowed list above.
- For dates like "today at 9PM", use today's date in IST.
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

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: text.slice(0, 2000) }],
    });

    const raw = res.content[0]?.type === "text" ? res.content[0].text : "";
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
