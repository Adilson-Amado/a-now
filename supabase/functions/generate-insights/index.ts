import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks, stats, timeFrame } = await req.json();
    
    if (!tasks || !Array.isArray(tasks)) {
      return new Response(
        JSON.stringify({ error: "Tasks array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const tasksSummary = tasks.map(t => 
      `- ${t.title} (${t.priority}, ${t.status})`
    ).join('\n');

    const prompt = `Como um coach de produtividade especializado, analise estes dados e forneça insights acionáveis:

Estatísticas:
- Tarefas completadas hoje: ${stats?.completedToday || 0}
- Tarefas pendentes: ${stats?.pendingTasks || 0}
- Minutos produtivos: ${stats?.productiveMinutes || 0}
- Sequência atual: ${stats?.currentStreak || 0} dias

Tarefas:
${tasksSummary}

Período de análise: ${timeFrame || 'daily'}

Forneça insights personalizados em formato JSON com esta estrutura exata:
{
  "insights": [
    {
      "type": "tip|warning|suggestion|praise",
      "message": "mensagem específica e acionável",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "summary": "resumo geral da situação atual"
}

Seja específico, positivo e focado em ações concretas. Máximo 5 insights.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
            topK: 40,
            topP: 0.95,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", response.status, errorData);
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${response.status}`,
          details: errorData.error?.message || response.statusText 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response from Gemini API");
    }

    const content = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const insightsData = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the response
    const sanitizedData = {
      insights: Array.isArray(insightsData.insights) ? insightsData.insights.slice(0, 5) : [],
      recommendations: Array.isArray(insightsData.recommendations) ? insightsData.recommendations.slice(0, 3) : [],
      summary: insightsData.summary || 'Análise de produtividade concluída.'
    };

    return new Response(
      JSON.stringify(sanitizedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: {
          insights: [{
            type: "tip",
            message: "Continue focado nas suas tarefas importantes.",
            priority: "medium"
          }],
          recommendations: ["Mantenha o foco", "Faça pausas regulares"],
          summary: "Análise básica de produtividade."
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
