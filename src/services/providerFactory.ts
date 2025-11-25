
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AIProvider } from '../types/ai';

export const getVercelModel = (provider: AIProvider, apiKey: string, modelId: string) => {
  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  switch (provider) {
    case AIProvider.Google: {
      const google = createGoogleGenerativeAI({ apiKey });
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
            'HTTP-Referer': window.location.href,
            'X-Title': 'SFL Prompt Studio'
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