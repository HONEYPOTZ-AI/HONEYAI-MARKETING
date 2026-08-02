/** Azure OpenAI service wrapping the Model Router Responses API */
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY || '';
const OPENAI_ENDPOINT = 'https://modelrouter-ai.services.ai.azure.com/api/projects/MODELROUTER-AI/openai/v1/responses';
const OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

interface GenerateOptions {
  prompt: string;
  instructions: string;
  model?: string;
  maxTokens?: number;
}

function buildAuthHeaders() {
  return { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' };
}

function extractResponseText(data: any): string {
  for (const out of data.output || []) {
    if (out.type === 'message') {
      for (const c of out.content || []) {
        if (c.type === 'output_text' && c.text) return c.text;
      }
    }
  }
  return '';
}

export async function generateText(opts: GenerateOptions): Promise<{ text: string; model: string; tokensUsed: number }> {
  const model = opts.model || OPENAI_DEPLOYMENT;
  let maxTokens = opts.maxTokens || 2000;

  // Reasoning models need more output tokens
  if (/kimi|deepseek-r1|o1|o3/i.test(model) && maxTokens < 4000) {
    maxTokens = 4000;
  }

  const body = {
    model,
    instructions: opts.instructions,
    input: opts.prompt,
    max_output_tokens: maxTokens,
  };

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('OpenAI error:', response.status, errText);
    throw new Error(`AI service unavailable: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    console.error('OpenAI API error:', JSON.stringify(data.error));
    throw new Error('AI service error');
  }

  const text = extractResponseText(data);
  const tokensUsed = (data.usage?.output_tokens || 0) + (data.usage?.input_tokens || 0);
  return { text, model: data.model || model, tokensUsed };
}

export function isConfigured(): boolean {
  return OPENAI_API_KEY.length > 0;
}