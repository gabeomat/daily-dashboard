import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const expectedKey = Deno.env.get("OS_PULSE_API_KEY");
    if (!expectedKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token || token !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [entriesRes, metricsRes, insightsRes, tasksRes] = await Promise.all([
      sb
        .from("daily_entries")
        .select("date, mrr, retention, members, traffic, discovery, profile_activity")
        .order("date", { ascending: false })
        .limit(7),
      sb
        .from("daily_metrics")
        .select("date, ad_spend, t18, t47, t333")
        .order("date", { ascending: false })
        .limit(7),
      sb
        .from("ai_insights")
        .select("date, module, response")
        .order("date", { ascending: false })
        .limit(3),
      sb
        .from("tasks")
        .select("label, category, date, is_completed, is_default, sort_order, weight")
        .order("date", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(30),
    ]);

    for (const r of [entriesRes, metricsRes, insightsRes, tasksRes]) {
      if (r.error) throw r.error;
    }

    return new Response(
      JSON.stringify({
        pulled_at: new Date().toISOString(),
        daily_entries: entriesRes.data,
        daily_metrics: metricsRes.data,
        ai_insights: insightsRes.data,
        tasks: tasksRes.data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("os-pulse error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
