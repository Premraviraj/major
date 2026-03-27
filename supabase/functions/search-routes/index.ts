// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to   = url.searchParams.get("to");
  const type = url.searchParams.get("type"); // bus | metro | train | null (all)

  if (!from || !to) {
    return new Response(JSON.stringify({ error: "from and to are required" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    (globalThis as any).Deno.env.get("SUPABASE_URL")!,
    (globalThis as any).Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Full-text search on unified_stops
  let fromQuery = supabase.from("unified_stops")
    .select("id, type, source_id, name, lat, lon")
    .textSearch("name", from, { type: "websearch" })
    .limit(5);

  let toQuery = supabase.from("unified_stops")
    .select("id, type, source_id, name, lat, lon")
    .textSearch("name", to, { type: "websearch" })
    .limit(5);

  if (type) {
    fromQuery = fromQuery.eq("type", type);
    toQuery   = toQuery.eq("type", type);
  }

  const [{ data: fromStops }, { data: toStops }] = await Promise.all([fromQuery, toQuery]);

  // Fetch matching routes
  let routesQuery = supabase.from("unified_routes").select("*").limit(20);
  if (type) routesQuery = routesQuery.eq("type", type);
  const { data: routes } = await routesQuery;

  return new Response(
    JSON.stringify({ from_stops: fromStops || [], to_stops: toStops || [], routes: routes || [] }),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
