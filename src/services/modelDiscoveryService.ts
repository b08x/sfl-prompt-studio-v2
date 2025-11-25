
import { AIProvider, AIModelConfig } from '../types/ai';

// Fallback static lists in case API calls fail
const OPENAI_MODELS_FALLBACK: AIModelConfig[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI, contextWindow: 128000, supportsVision: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: AIProvider.OpenAI, contextWindow: 128000, supportsVision: true },
  { id: 'gpt-4', name: 'GPT-4', provider: AIProvider.OpenAI, contextWindow: 8192, supportsVision: false },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI, contextWindow: 16385, supportsVision: false },
];

const ANTHROPIC_MODELS_FALLBACK: AIModelConfig[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
];

const fetchOpenAIModels = async (apiKey: string): Promise<AIModelConfig[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`OpenAI API Error: ${response.statusText}, using fallback list`);
      return OPENAI_MODELS_FALLBACK;
    }

    const data = await response.json();
    if (!data.data) return OPENAI_MODELS_FALLBACK;

    // Filter for chat models (gpt-* models that support chat completions)
    const chatModels = data.data
      .filter((m: any) => m.id.startsWith('gpt-') && !m.id.includes('instruct'))
      .map((m: any) => ({
        id: m.id,
        name: m.id.split('-').map((word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        provider: AIProvider.OpenAI,
        contextWindow: m.id.includes('gpt-4') ?
          (m.id.includes('turbo') || m.id.includes('4o') ? 128000 : 8192) :
          16385,
        supportsVision: m.id.includes('vision') || m.id.includes('4o') || m.id.includes('4-turbo'),
      }))
      .sort((a: AIModelConfig, b: AIModelConfig) => b.id.localeCompare(a.id));

    return chatModels.length > 0 ? chatModels : OPENAI_MODELS_FALLBACK;
  } catch (error) {
    console.error('Failed to fetch OpenAI models:', error);
    return OPENAI_MODELS_FALLBACK;
  }
};

const fetchAnthropicModels = async (apiKey: string): Promise<AIModelConfig[]> => {
  // Note: Anthropic doesn't have a public /models endpoint as of now
  // We'll use the fallback list but attempt a simple validation call
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });

    // If we get any response (even rate limit), the key works
    // and we can use our curated list
    if (response.ok || response.status === 429) {
      return ANTHROPIC_MODELS_FALLBACK;
    }

    console.warn(`Anthropic API validation failed: ${response.statusText}`);
    return ANTHROPIC_MODELS_FALLBACK;
  } catch (error) {
    console.error('Failed to validate Anthropic API key:', error);
    return ANTHROPIC_MODELS_FALLBACK;
  }
};

const fetchGoogleModels = async (apiKey: string): Promise<AIModelConfig[]> => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!response.ok) throw new Error(`Google API Error: ${response.statusText}`);
  
  const data = await response.json();
  if (!data.models) return [];

  return data.models
    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: any) => {
      const id = m.name.replace('models/', '');
      return {
        id: id,
        name: m.displayName || id,
        provider: AIProvider.Google,
        contextWindow: m.inputTokenLimit || 32000,
        supportsVision: id.includes('gemini') && !id.includes('1.0-pro'), 
      };
    })
    .sort((a: AIModelConfig, b: AIModelConfig) => a.name.localeCompare(b.name));
};

const fetchOpenRouterModels = async (apiKey: string): Promise<AIModelConfig[]> => {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.href,
      'X-Title': 'SFL Prompt Studio',
    }
  });
  
  if (!response.ok) throw new Error(`OpenRouter API Error: ${response.statusText}`);
  
  const data = await response.json();
  if (!data.data) return [];

  return data.data.map((m: any) => ({
    id: m.id,
    name: m.name || m.id,
    provider: AIProvider.OpenRouter,
    contextWindow: m.context_length || 4096,
    supportsVision: m.architecture?.modality?.includes('image') || false,
  })).sort((a: AIModelConfig, b: AIModelConfig) => a.name.localeCompare(b.name));
};

const fetchMistralModels = async (apiKey: string): Promise<AIModelConfig[]> => {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`Mistral API Error: ${response.statusText}`);

  const data = await response.json();
  if (!data.data) return [];

  return data.data.map((m: any) => ({
    id: m.id,
    name: m.id, 
    provider: AIProvider.Mistral,
    contextWindow: 32000,
    supportsVision: m.id.includes('pixtral'), 
  })).sort((a: AIModelConfig, b: AIModelConfig) => a.name.localeCompare(b.name));
};

export const fetchModels = async (provider: AIProvider, apiKey: string): Promise<AIModelConfig[]> => {
  if (!apiKey) {
    // Return fallback lists for OpenAI and Anthropic even without API key
    // so users can see what's available
    if (provider === AIProvider.OpenAI) return OPENAI_MODELS_FALLBACK;
    if (provider === AIProvider.Anthropic) return ANTHROPIC_MODELS_FALLBACK;
    return [];
  }

  try {
    switch (provider) {
      case AIProvider.Google: return await fetchGoogleModels(apiKey);
      case AIProvider.OpenRouter: return await fetchOpenRouterModels(apiKey);
      case AIProvider.Mistral: return await fetchMistralModels(apiKey);
      case AIProvider.OpenAI: return await fetchOpenAIModels(apiKey);
      case AIProvider.Anthropic: return await fetchAnthropicModels(apiKey);
      default: return [];
    }
  } catch (error) {
    console.error(`Failed to fetch models for ${provider}:`, error);
    // Return fallback lists for OpenAI/Anthropic on error
    if (provider === AIProvider.OpenAI) return OPENAI_MODELS_FALLBACK;
    if (provider === AIProvider.Anthropic) return ANTHROPIC_MODELS_FALLBACK;
    return [];
  }
};
