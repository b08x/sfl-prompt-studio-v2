
import { AIProvider, AIModelConfig } from '../types/ai';

// --- Hardcoded Fallbacks for Providers without easy public list endpoints ---

const OPENAI_MODELS: AIModelConfig[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI, contextWindow: 128000, supportsVision: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: AIProvider.OpenAI, contextWindow: 128000, supportsVision: true },
  { id: 'gpt-4', name: 'GPT-4', provider: AIProvider.OpenAI, contextWindow: 8192, supportsVision: false },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI, contextWindow: 16385, supportsVision: false },
];

const ANTHROPIC_MODELS: AIModelConfig[] = [
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: AIProvider.Anthropic, contextWindow: 200000, supportsVision: true },
];

// --- Fetch Functions ---

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
        // Broad assumption: Modern Gemini models (1.5+) are multimodal.
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
    name: m.id, // Mistral usually relies on IDs like 'mistral-large-latest'
    provider: AIProvider.Mistral,
    contextWindow: 32000, // Default fallback as Mistral list endpoint often lacks this specific metadata field standardly
    supportsVision: m.id.includes('pixtral'), // Pixtral is their vision model
  })).sort((a: AIModelConfig, b: AIModelConfig) => a.name.localeCompare(b.name));
};

// --- Main Discovery Function ---

export const fetchModels = async (provider: AIProvider, apiKey: string): Promise<AIModelConfig[]> => {
  if (!apiKey && provider !== AIProvider.OpenAI && provider !== AIProvider.Anthropic) {
      // OpenAI/Anthropic have hardcoded lists, so they might display even without a key initially if desired, 
      // though validation usually checks key first. 
      // For dynamic fetchers, we need the key.
      return []; 
  }

  try {
    switch (provider) {
      case AIProvider.Google:
        return await fetchGoogleModels(apiKey);
      case AIProvider.OpenRouter:
        return await fetchOpenRouterModels(apiKey);
      case AIProvider.Mistral:
        return await fetchMistralModels(apiKey);
      case AIProvider.OpenAI:
        return OPENAI_MODELS;
      case AIProvider.Anthropic:
        return ANTHROPIC_MODELS;
      default:
        console.warn(`Model discovery not implemented for provider: ${provider}`);
        return [];
    }
  } catch (error) {
    console.error(`Failed to fetch models for ${provider}:`, error);
    // Return empty array to allow UI to handle empty state gracefully
    return [];
  }
};
