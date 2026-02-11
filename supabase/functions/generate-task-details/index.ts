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
    const { title, description, priority, context } = await req.json();
    
    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `Como um assistente de produtividade especializado, analise esta tarefa e forneça detalhes úteis:

Título: ${title}
Descrição: ${description || 'Não fornecida'}
Prioridade: ${priority || 'Não definida'}

Contexto adicional:
- Tarefas atuais: ${context?.currentTasks?.join(', ') || 'Nenhuma'}
- Completadas hoje: ${context?.completedToday || 0}
- Momento do dia: ${context?.timeOfDay || 'Não especificado'}
- Nível de energia: ${context?.energyLevel || 'Não especificado'}

Forneça uma resposta em formato JSON com esta estrutura exata:
{
  "description": "Descrição detalhada e clara da tarefa",
  "estimatedMinutes": número estimado de minutos (entre 5 e 240),
  "subtasks": ["subtarefa 1", "subtarefa 2", "subtarefa 3"],
  "tips": ["dica útil 1", "dica útil 2"],
  "priority": "urgent|important|can-wait|dispensable",
  "aiReason": "explicação curta da classificação"
}

Seja prático, específico e considere o contexto fornecido.`;

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
            maxOutputTokens: 800,
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

    const taskDetails = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the response
    const sanitizedDetails = {
      description: taskDetails.description || content.substring(0, 200),
      estimatedMinutes: Math.min(Math.max(taskDetails.estimatedMinutes || 30, 5), 240),
      subtasks: Array.isArray(taskDetails.subtasks) ? taskDetails.subtasks.slice(0, 5) : [],
      tips: Array.isArray(taskDetails.tips) ? taskDetails.tips.slice(0, 3) : [],
      priority: taskDetails.priority || priority || 'can-wait',
      aiReason: taskDetails.aiReason || 'Análise baseada no título e contexto da tarefa'
    };

    return new Response(
      JSON.stringify(sanitizedDetails),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-task-details error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: {
          description: "Não foi possível gerar detalhes automáticos no momento.",
          estimatedMinutes: 30,
          subtasks: [],
          tips: [],
          priority: "can-wait",
          aiReason: "Erro na geração automática"
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
