// @ts-ignore: Deno URL imports resolved at runtime by Supabase Edge Functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Deno URL imports resolved at runtime by Supabase Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const TOKENS_PER_KM = 10;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** SHA-256 hash of a string, returned as hex */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface TripBody {
  userId: string;
  distance: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const { userId, distance } = (await req.json()) as TripBody;

    if (!userId || !distance || distance <= 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const tokensEarned = distance * TOKENS_PER_KM;
    const loggedAt = new Date().toISOString();

    // 1. Store trip record
    const { error: tripError } = await supabase.from("trips").insert({
      user_id: userId,
      distance_km: distance,
      tokens_earned: tokensEarned,
      logged_at: loggedAt,
    });
    if (tripError) throw new Error(`Trip insert failed: ${tripError.message}`);

    // 2. Update user's total token balance
    const { error: tokenError } = await supabase.rpc("increment_tokens", {
      p_user_id: userId,
      p_amount: tokensEarned,
    });
    if (tokenError) throw new Error(`Token update failed: ${tokenError.message}`);

    // 3. Build hash-chain ledger entry — get previous hash to chain from
    const { data: prevData } = await supabase.rpc("get_latest_ledger_hash");
    const prevHash = prevData as string;

    // Hash = SHA-256(userId | distance | tokens | timestamp | prevHash)
    const entryHash = await sha256(
      `${userId}|${distance}|${tokensEarned}|${loggedAt}|${prevHash}`
    );

    const { error: ledgerError } = await supabase.from("reward_ledger").insert({
      user_id: userId,
      distance_km: distance,
      tokens: tokensEarned,
      logged_at: loggedAt,
      entry_hash: entryHash,
      prev_hash: prevHash,
    });
    if (ledgerError) throw new Error(`Ledger insert failed: ${ledgerError.message}`);

    return new Response(
      JSON.stringify({ success: true, tokensEarned, entryHash }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
