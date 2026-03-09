import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a concise business strategist for a solo-founder. You analyze daily operational data and return actionable insights.

RULES:
- Be concise, strategic, and practical. No fluff.
- Never invent or assume data that isn't provided. If data is limited, say so.
- Speak directly to the founder as "you."
- Each section should be 1-2 sentences max.
- Use the business context provided to make your insights specific and relevant to their actual business model, pricing, and goals.
- Do not assume the user should complete every task every day. The task list represents a mix of daily, occasional, rotational, and situational business actions. Judge progress based on momentum, leverage, and alignment with priorities — not perfect task completion. Weighted high-impact tasks matter more than raw task count. Missing some tasks is normal and not automatically a problem.

You MUST respond using the "strategic_insight" tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch business context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data: ctxRow } = await sb
      .from("business_context")
      .select("value")
      .eq("key", "business_profile")
      .maybeSingle();
    const bizContext = ctxRow?.value ? JSON.stringify(ctxRow.value, null, 2) : "No business context available.";

    const userPrompt = `Here is the dashboard data for ${payload.reportingDate}:

NORTH STAR METRICS:
- MRR: $${payload.mrr ?? "N/A"}
- Members: ${payload.members ?? "N/A"}
- Retention: ${payload.retention ?? "N/A"}%

TASK COMPLETION:
- Weighted score: ${payload.taskScore}/${payload.taskTotal} (${payload.taskPct}%)
- Tasks completed: ${payload.tasksCompleted}/${payload.tasksCount}

SIGNAL SUMMARY:
- What Changed: ${payload.signalChanged}
- What Looks Off: ${payload.signalOff}
- What to Focus On: ${payload.signalFocus}

CEO NOTES:
- Biggest Win: ${payload.biggestWin || "Not logged"}
- Biggest Bottleneck: ${payload.biggestBottleneck || "Not logged"}
- Real Priority: ${payload.realPriority || "Not logged"}

RECENT TREND (last entries):
${payload.recentTrend || "No trend data available."}

BUSINESS CONTEXT:
${bizContext}

Analyze this data and provide your strategic insight.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "strategic_insight",
                description:
                  "Return a structured strategic insight with exactly 4 sections.",
                parameters: {
                  type: "object",
                  properties: {
                    main_insight: {
                      type: "string",
                      description:
                        "The single most important takeaway from today's data. 1-2 sentences.",
                    },
                    biggest_risk: {
                      type: "string",
                      description:
                        "The biggest threat or concern based on the data. 1-2 sentences.",
                    },
                    best_next_move: {
                      type: "string",
                      description:
                        "The single highest-leverage action to take next. 1-2 sentences.",
                    },
                    deprioritize: {
                      type: "string",
                      description:
                        "What to stop or deprioritize right now. 1-2 sentences.",
                    },
                  },
                  required: [
                    "main_insight",
                    "biggest_risk",
                    "best_next_move",
                    "deprioritize",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "strategic_insight" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", status, body);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned from model");

    const insight = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-strategist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
