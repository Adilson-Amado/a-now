interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

class DirectGeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-1.5-flash';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('❌ Gemini API key not found in environment variables');
      console.error('📋 Available env vars:', Object.keys(import.meta.env).filter(k => k.includes('GEMINI')));
      console.warn('⚠️ AI features will be disabled. Please check your .env file.');
    } else {
      console.log('✅ Gemini API key loaded successfully');
    }
  }

  private async callGemini(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody: GeminiRequest = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1024,
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
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  // Generate task details
  async generateTaskDetails(title: string, description?: string, priority?: string, context?: any) {
    console.log('🚀 Starting AI task generation for:', title);
    
    if (!this.apiKey) {
      console.error('❌ Cannot generate task details: No API key configured');
      throw new Error('Gemini API key not configured. Please check your .env file.');
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

    try {
      console.log('📤 Sending request to Gemini API...');
      const response = await this.callGemini(prompt, { maxTokens: 800, temperature: 0.7 });
      console.log('📥 Received response from Gemini API');
      
      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔍 Parsing JSON from response...');
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed AI response');
        return {
          description: parsed.description || response,
          estimatedMinutes: Math.min(Math.max(parsed.estimatedMinutes || 30, 5), 240),
          subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.slice(0, 5) : [],
          tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
          priority: parsed.priority || priority || 'can-wait',
          aiReason: parsed.aiReason || 'Análise baseada no título e contexto'
        };
      }

      console.warn('⚠️ JSON parsing failed, using fallback response');
      // Fallback if JSON parsing fails
      return {
        description: response,
        estimatedMinutes: 30,
        subtasks: [],
        tips: [],
        priority: priority || 'can-wait',
        aiReason: 'Análise básica'
      };

    } catch (error) {
      console.error('❌ Error generating task details:', error);
      console.error('📊 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        title,
        hasApiKey: !!this.apiKey
      });
      throw new Error('Falha ao gerar detalhes da tarefa');
    }
  }

  // Generate note content
  async generateNoteContent(title: string, category?: string, existingNotes?: string[], context?: string) {
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

    try {
      const response = await this.callGemini(prompt, { maxTokens: 1200, temperature: 0.8 });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: parsed.content || response,
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
          outline: Array.isArray(parsed.outline) ? parsed.outline.slice(0, 5) : []
        };
      }

      return {
        content: response,
        tags: [],
        outline: []
      };

    } catch (error) {
      console.error('Error generating note content:', error);
      throw new Error('Falha ao gerar conteúdo da nota');
    }
  }

  // Generate insights
  async generateInsights(tasks: any[], stats: any, timeFrame: string = 'daily') {
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

Período de análise: ${timeFrame}

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

    try {
      const response = await this.callGemini(prompt, { maxTokens: 600, temperature: 0.7 });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : [],
          summary: parsed.summary || 'Análise de produtividade concluída.'
        };
      }

      return {
        insights: [],
        recommendations: [],
        summary: response
      };

    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Falha ao gerar insights');
    }
  }
}

// Export singleton instance
export const directGeminiService = new DirectGeminiService();
