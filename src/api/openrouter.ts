export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

function buildSystemPrompt(level: string, topic: string): string {
  const levelDescriptions: Record<string, string> = {
    A1: 'complete beginner — use only very simple, short sentences and basic vocabulary',
    A2: 'elementary — use simple sentences and common everyday vocabulary',
    B1: 'intermediate — use moderately complex sentences and standard vocabulary',
    B2: 'upper-intermediate — use more advanced vocabulary and varied sentence structures',
  };

  const levelDesc = levelDescriptions[level] ?? levelDescriptions['A2'];

  return `Tu es un professeur de français sympathique et encourageant. Tu aides les apprenants à pratiquer la conversation en français.

Règles importantes :
1. Réponds TOUJOURS en français.
2. Tes réponses doivent être COURTES : 1 à 3 phrases maximum (pour la synthèse vocale).
3. Le niveau de l'apprenant est ${level} (${levelDesc}). Adapte ton vocabulaire et ta complexité à ce niveau.
4. Le thème de la conversation est : "${topic}".
5. Si l'apprenant fait une erreur de français, corrige-la gentiment en une phrase courte, puis continue la conversation.
6. Termine TOUJOURS ta réponse par une question pour encourager l'apprenant à continuer à parler.
7. Sois chaleureux, patient et enthousiaste pour motiver l'apprenant.`;
}

export async function chatWithFrenchTutor(
  messages: ChatMessage[],
  level: string,
  topic: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured');
  }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: buildSystemPrompt(level, topic),
  };

  const payload = {
    model: MODEL,
    messages: [systemMessage, ...messages],
    max_tokens: 256,
    temperature: 0.7,
  };

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'Le Français Malin — Voice Mode',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenRouter');
  }

  return content.trim();
}
