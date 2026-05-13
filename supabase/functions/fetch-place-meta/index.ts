import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ISB Mohali coordinates
const ISB_LAT = 30.7046;
const ISB_LNG = 76.7179;

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m walk`;
  const mins = Math.round((km / 30) * 60); // ~30 km/h drive
  return `${Math.round(km * 10) / 10} km · ~${mins} min drive`;
}

// Expand short Maps URLs (maps.app.goo.gl) by following redirects
async function expandUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

// Extract place ID from a full Google Maps URL if present
function extractPlaceId(url: string): string | null {
  const m = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// Extract search query / place name from Maps URL for text search
function extractQuery(url: string): string | null {
  try {
    const u = new URL(url);
    // /maps/place/<name>/ pattern
    const placeMatch = u.pathname.match(/\/maps\/place\/([^/]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    // ?q= param
    const q = u.searchParams.get("q");
    if (q) return q;
  } catch { /* ignore */ }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }

  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const { url } = await req.json() as { url: string };
    if (!url) return new Response(JSON.stringify({ error: "url is required" }), { status: 400, headers: corsHeaders });

    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not set in Supabase secrets. Add it in Supabase Dashboard → Settings → Edge Functions → Secrets." }),
        { status: 503, headers: corsHeaders }
      );
    }

    // Expand short URL
    const expanded = await expandUrl(url);

    // Try place_id first, fall back to text search
    let placeId = extractPlaceId(expanded);

    if (!placeId) {
      const query = extractQuery(expanded) ?? expanded;
      const searchRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`
      );
      const searchData = await searchRes.json();
      placeId = searchData?.candidates?.[0]?.place_id ?? null;
    }

    if (!placeId) {
      return new Response(JSON.stringify({ error: "Could not resolve a Google place from this URL" }), { status: 422, headers: corsHeaders });
    }

    // Fetch place details
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,geometry,photos&key=${GOOGLE_API_KEY}`
    );
    const details = await detailsRes.json();
    const result = details?.result;
    if (!result) return new Response(JSON.stringify({ error: "Place not found" }), { status: 404, headers: corsHeaders });

    const name: string = result.name ?? "";
    const google_rating: number | null = result.rating ?? null;

    // Distance from ISB
    const loc = result.geometry?.location;
    let distance_from_campus: string | null = null;
    if (loc) {
      const km = haversineKm(ISB_LAT, ISB_LNG, loc.lat, loc.lng);
      distance_from_campus = formatDistance(km);
    }

    // First photo — follow the redirect to get the clean CDN URL (no API key stored in DB)
    let photo_url: string | null = null;
    const photoRef = result.photos?.[0]?.photo_reference;
    if (photoRef) {
      const apiPhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`;
      try {
        const photoRes = await fetch(apiPhotoUrl, { method: "HEAD", redirect: "follow" });
        photo_url = photoRes.url || apiPhotoUrl;
      } catch {
        photo_url = apiPhotoUrl; // fallback to API URL if redirect fails
      }
    }

    return new Response(
      JSON.stringify({ name, google_rating, distance_from_campus, photo_url, place_id: placeId }),
      { headers: corsHeaders }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
