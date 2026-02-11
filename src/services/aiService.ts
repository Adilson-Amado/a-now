interface AIRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface TaskGenerationRequest {
  title: string;
  description?: string;
  priority?: 'urgent' | 'important' | 'can-wait' | 'dispensable';
  context?: {
    currentTasks?: string[];
    completedToday?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    energyLevel?: 'high' | 'medium' | 'low';
  };
}

interface NoteGenerationRequest {
  title: string;
  category?: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
  existingNotes?: string[];
  context?: string;
}

interface InsightGenerationRequest {
  tasks: Array<{
    title: string;
    priority: string;
    status: string;
    completedAt?: string;
    estimatedMinutes?: number;
    actualMinutes?: number;
  }>;
  stats: {
    completedToday: number;
    pendingTasks: number;
    productiveMinutes: number;
    currentStreak: number;
  };
  timeFrame: 'daily' | 'weekly' | 'monthly';
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-1.5-flash';
  private cache = new Map<string, { response: AIResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('Gemini API key not found. AI features will be disabled.');
    }
  }

  private getCacheKey(prompt: string, context?: string): string {
    return `${prompt}-${context || ''}`;
  }

  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedResponse(key: string, response: AIResponse): void {
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  private async callGemini(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const cacheKey = this.getCacheKey(prompt);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const aiResponse: AIResponse = {
        content: data.candidates[0].content.parts[0].text,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        }
      };

      this.setCachedResponse(cacheKey, aiResponse);
      return aiResponse;

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  // Generate task details and suggestions
  async generateTaskDetails(request: TaskGenerationRequest): Promise<{
    description: string;
    estimatedMinutes: number;
    subtasks: string[];
    tips: string[];
    priority: string;
  }> {
    const prompt = `Como um assistente de produtividade especializado, analise esta tarefa e forneça detalhes úteis:

Título: ${request.title}
Descrição: ${request.description || 'Não fornecida'}
Prioridade: ${request.priority || 'Não definida'}

Contexto adicional:
- Tarefas atuais: ${request.context?.currentTasks?.join(', ') || 'Nenhuma'}
- Completadas hoje: ${request.context?.completedToday || 0}
- Momento do dia: ${request.context?.timeOfDay || 'Não especificado'}
- Nível de energia: ${request.context?.energyLevel || 'Não especificado'}

Forneça uma resposta em formato JSON com esta estrutura exata:
{
  "description": "Descrição detalhada e clara da tarefa",
  "estimatedMinutes": número estimado de minutos (entre 5 e 240),
  "subtasks": ["subtarefa 1", "subtarefa 2", "subtarefa 3"],
  "tips": ["dica útil 1", "dica útil 2"],
  "priority": "urgent|important|can-wait|dispensable"
}

Seja prático, específico e considere o contexto fornecido.`;

    try {
      const response = await this.callGemini(prompt, { maxTokens: 800, temperature: 0.7 });
      
      // Try to parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || response.content,
          estimatedMinutes: Math.min(Math.max(parsed.estimatedMinutes || 30, 5), 240),
          subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.slice(0, 5) : [],
          tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
          priority: parsed.priority || request.priority || 'can-wait'
        };
      }

      // Fallback if JSON parsing fails
      return {
        description: response.content,
        estimatedMinutes: 30,
        subtasks: [],
        tips: [],
        priority: request.priority || 'can-wait'
      };

    } catch (error) {
      console.error('Error generating task details:', error);
      throw new Error('Falha ao gerar detalhes da tarefa');
    }
  }

  // Generate note content
  async generateNoteContent(request: NoteGenerationRequest): Promise<{
    content: string;
    tags: string[];
    outline: string[];
  }> {
    const prompt = `Como um assistente de organização e escrita, crie conteúdo detalhado para esta nota:

Título: ${request.title}
Categoria: ${request.category || 'personal'}
Contexto: ${request.context || 'Não fornecido'}

Notas existentes relacionadas: ${request.existingNotes?.slice(0, 3).join(', ') || 'Nenhuma'}

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
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: parsed.content || response.content,
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
          outline: Array.isArray(parsed.outline) ? parsed.outline.slice(0, 5) : []
        };
      }

      return {
        content: response.content,
        tags: [],
        outline: []
      };

    } catch (error) {
      console.error('Error generating note content:', error);
      throw new Error('Falha ao gerar conteúdo da nota');
    }
  }

  // Generate AI insights
  async generateInsights(request: InsightGenerationRequest): Promise<{
    insights: Array<{
      type: 'tip' | 'warning' | 'suggestion' | 'praise';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    recommendations: string[];
    summary: string;
  }> {
    const tasksSummary = request.tasks.map(t => 
      `- ${t.title} (${t.priority}, ${t.status})`
    ).join('\n');

    const prompt = `Como um coach de produtividade especializado, analise estes dados e forneça insights acionáveis:

Estatísticas:
- Tarefas completadas hoje: ${request.stats.completedToday}
- Tarefas pendentes: ${request.stats.pendingTasks}
- Minutos produtivos: ${request.stats.productiveMinutes}
- Sequência atual: ${request.stats.currentStreak} dias

Tarefas:
${tasksSummary}

Período de análise: ${request.timeFrame}

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
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
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
        summary: response.content
      };

    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Falha ao gerar insights');
    }
  }

  // Generate productivity analysis
  async analyzeProductivity(data: {
    tasks: any[];
    timeRange: 'week' | 'month' | 'quarter';
    goals: any[];
  }): Promise<{
    score: number;
    trends: string[];
    strengths: string[];
    improvements: string[];
    forecast: string;
  }> {
    const prompt = `Como analista de produtividade, avalie estes dados e forneça análise completa:

Período: ${data.timeRange}
Total de tarefas: ${data.tasks.length}
Metas: ${data.goals.length}

Analise padrões, tendências e forneça previsões.

Responda em formato JSON:
{
  "score": número de 0 a 100,
  "trends": ["tendência 1", "tendência 2"],
  "strengths": ["força 1", "força 2"],
  "improvements": ["melhoria 1", "melhoria 2"],
  "forecast": "previsão para próximo período"
}

Seja analítico e objetivo.`;

    try {
      const response = await this.callGemini(prompt, { maxTokens: 500, temperature: 0.6 });
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(Math.max(parsed.score || 70, 0), 100),
          trends: Array.isArray(parsed.trends) ? parsed.trends.slice(0, 3) : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
          forecast: parsed.forecast || 'Previsão não disponível'
        };
      }

      return {
        score: 70,
        trends: [],
        strengths: [],
        improvements: [],
        forecast: response.content
      };

    } catch (error) {
      console.error('Error analyzing productivity:', error);
      throw new Error('Falha na análise de produtividade');
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export type { AIRequest, AIResponse, TaskGenerationRequest, NoteGenerationRequest, InsightGenerationRequest };
