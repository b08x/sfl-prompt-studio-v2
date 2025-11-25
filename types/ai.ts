
export enum AIProvider {
  Google = 'google',
  OpenAI = 'openai',
  OpenRouter = 'openrouter',
  Anthropic = 'anthropic',
  Mistral = 'mistral'
}

export type ApiKeyStatus = 'unverified' | 'valid' | 'invalid' | 'ratelimited' | 'checking';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  supportsVision: boolean;
}

export interface ProviderConfig {
  baseUrl?: string;
  metadata?: Record<string, any>;
}
