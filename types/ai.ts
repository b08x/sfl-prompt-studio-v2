
/**
 * Unified AI Provider Types
 * 
 * Centralized type definitions for the unified AI provider layer.
 * Defines the contracts for providers, models, and configuration.
 */

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
  /** 
   * Base URL for the provider's API. 
   * Critical for providers like OpenRouter or when using proxies.
   */
  baseUrl?: string;
  
  /**
   * Optional metadata or additional configuration specific to the provider.
   */
  metadata?: Record<string, any>;
}
