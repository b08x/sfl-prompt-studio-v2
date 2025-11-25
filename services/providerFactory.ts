
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AIProvider } from '../types/ai';

/**
 * Factory function to create a Vercel AI SDK model instance based on provider configuration.
 * This abstracts the underlying SDK differences, allowing the Chat UI to be provider-agnostic.
 * 
 * @param provider - The AI provider (google, openai, openrouter, etc.)
 * @param apiKey - The API key for the selected provider
 * @param modelId - The specific model ID (e.g., 'gemini-1.5-pro', 'gpt-4o')
 * @returns A Vercel AI SDK `LanguageModel` instance
 */
export const getVercelModel = (provider: AIProvider, apiKey: string, modelId: string) => {
  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  switch (provider) {
    case AIProvider.Google: {
      const google = createGoogleGenerativeAI({ apiKey });
      // Google provider usually handles models directly
      return google(modelId);
    }

    case AIProvider.OpenAI: {
      const openai = createOpenAI({ 
        apiKey, 
        compatibility: 'strict' 
      });
      return openai(modelId);
    }

    case AIProvider.OpenRouter: {
      const openrouter = createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
            'HTTP-Referer': window.location.href, // Required by OpenRouter
            'X-Title': 'SFL Prompt Studio'        // Required by OpenRouter
        }
      });
      return openrouter(modelId);
    }

    case AIProvider.Mistral: {
        const mistral = createMistral({ apiKey });
        return mistral(modelId);
    }

    case AIProvider.Anthropic: {
        const anthropic = createAnthropic({ apiKey });
        return anthropic(modelId);
    }

    default:
      throw new Error(`Provider ${provider} not supported in factory.`);
  }
};
