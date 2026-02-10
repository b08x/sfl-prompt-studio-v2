/**
 * AI Model Configuration
 *
 * Central source of truth for AI model identifiers across the application.
 * This prevents hardcoded model strings and enables easy version updates.
 */

import { AIProvider, AIModelConfig } from '../types/ai';

// ============================================================================
// Default Model Constants
// ============================================================================

/**
 * Default Gemini model for general text generation and workflows
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Model used for API key validation (should be fast and cost-effective)
 */
export const VALIDATION_MODEL_GEMINI = 'gemini-2.5-flash';

/**
 * Model for image analysis tasks
 */
export const IMAGE_ANALYSIS_MODEL = 'gemini-2.5-flash';

/**
 * Model for grounded search with Google Search integration
 */
export const GROUNDED_MODEL = 'gemini-2.5-flash';

// ============================================================================
// Provider-Specific Model Configurations
// ============================================================================

/**
 * Predefined model configurations for different providers
 */
export const MODEL_CONFIGS: Record<AIProvider, AIModelConfig[]> = {
  [AIProvider.Google]: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: AIProvider.Google,
      contextWindow: 1000000,
      supportsVision: true,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: AIProvider.Google,
      contextWindow: 2000000,
      supportsVision: true,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: AIProvider.Google,
      contextWindow: 1000000,
      supportsVision: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: AIProvider.Google,
      contextWindow: 2000000,
      supportsVision: true,
    },
  ],

  [AIProvider.OpenAI]: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: AIProvider.OpenAI,
      contextWindow: 128000,
      supportsVision: true,
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: AIProvider.OpenAI,
      contextWindow: 128000,
      supportsVision: true,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: AIProvider.OpenAI,
      contextWindow: 16385,
      supportsVision: false,
    },
  ],

  [AIProvider.OpenRouter]: [],
  [AIProvider.Anthropic]: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: AIProvider.Anthropic,
      contextWindow: 200000,
      supportsVision: true,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: AIProvider.Anthropic,
      contextWindow: 200000,
      supportsVision: true,
    },
  ],
  [AIProvider.Mistral]: [
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      provider: AIProvider.Mistral,
      contextWindow: 128000,
      supportsVision: false,
    },
    {
      id: 'mistral-tiny',
      name: 'Mistral Tiny',
      provider: AIProvider.Mistral,
      contextWindow: 32000,
      supportsVision: false,
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the default model for a given provider
 */
export const getDefaultModelForProvider = (provider: AIProvider): string => {
  switch (provider) {
    case AIProvider.Google:
      return DEFAULT_GEMINI_MODEL;
    case AIProvider.OpenAI:
      return 'gpt-4o';
    case AIProvider.Anthropic:
      return 'claude-3-5-sonnet-20241022';
    case AIProvider.Mistral:
      return 'mistral-large-latest';
    case AIProvider.OpenRouter:
      return 'openai/gpt-4o';
    default:
      return DEFAULT_GEMINI_MODEL;
  }
};

/**
 * Get model configuration by ID
 */
export const getModelConfig = (modelId: string): AIModelConfig | undefined => {
  for (const configs of Object.values(MODEL_CONFIGS)) {
    const found = configs.find(c => c.id === modelId);
    if (found) return found;
  }
  return undefined;
};

/**
 * Check if a model supports vision/image analysis
 */
export const supportsVision = (modelId: string): boolean => {
  const config = getModelConfig(modelId);
  return config?.supportsVision ?? false;
};
