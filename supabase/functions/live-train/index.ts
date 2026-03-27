// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const trainNo = url.searchParams.get("train_no");
  const date    = url.searchParams.get("date") || new Date().toISOString().split("T")[0].replace(/-/g, "");

  if (!trainNo) {
    return new Response(JSON.stringify({ error: "train_no is required" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = (globalThis as any).Deno.env.get("RAPIDAPI_KEY");
    const res = await fetch(
      `https://indian-railway-irctc.p.rapidapi.com/api/trains/v1/train/status?departure_date=${date}&isH5=true&client=web&train_number=${trainNo}`,
      {
        headers: {
          "x-rapidapi-host": "indian-railway-irctc.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
          "x-rapid-api": "rapid-api-database",
        },
      }
    );

    if (!res.ok) throw new Error(`RapidAPI error: ${res.status}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
