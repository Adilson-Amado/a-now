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
    const { title, category, existingNotes, context } = await req.json();
    
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

    const prompt = `Como um assistente de organização e escrita, crie conteúdo detalhado para esta nota:

Título: ${title}
Categoria: ${category || 'personal'}
Contexto: ${context || 'Não fornecido'}

Notas existentes relacionadas: ${existingNotes?.slice(0, 3).join(', ') || 'Nenhuma'}

Crie conteúdo em formato Markdown com:
1. Introdução clara e objetiva
2. Seções organizadas com subtítulos
3. Lista de pontos importantes
4. Conclusão ou próximos passos (se aplicável)

Forneça uma resposta em formato JSON com esta estrutura exata:
{
  "content": "conteúdo completo em markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "outline": ["seção 1", "seção 2", "seção 3"]
}

Seja informativo, prático e adaptado à categoria da nota.`;

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
            temperature: 0.8,
            maxOutputTokens: 1200,
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

    const noteDetails = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the response
    const sanitizedDetails = {
      content: noteDetails.content || content,
      tags: Array.isArray(noteDetails.tags) ? noteDetails.tags.slice(0, 5) : [],
      outline: Array.isArray(noteDetails.outline) ? noteDetails.outline.slice(0, 5) : []
    };

    return new Response(
      JSON.stringify(sanitizedDetails),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-note-content error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: {
          content: `# ${title || 'Nova Nota'}\n\nNão foi possível gerar conteúdo automático no momento. Você pode começar escrevendo aqui.`,
          tags: [],
          outline: []
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
