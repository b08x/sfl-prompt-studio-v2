
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { AIProvider, ApiKeyStatus } from "../types/ai";

interface ValidationResult {
  status: ApiKeyStatus;
  error?: string;
}

/**
 * Maps HTTP error codes to ApiKeyStatus.
 * 401/403 -> invalid
 * 429 -> ratelimited
 * others -> invalid (generic error)
 */
const mapErrorToStatus = (error: any): ValidationResult => {
  console.warn("API Validation Error:", error);
  
  const status = error?.status || error?.response?.status || error?.statusCode;
  const message = error?.message || error?.error?.message || "Unknown validation error";

  if (status === 401 || status === 403) {
    return { status: 'invalid', error: 'Invalid API Key (401/403)' };
  }
  if (status === 429) {
    return { status: 'ratelimited', error: 'Rate Limit Exceeded (429)' };
  }
  
  // Check text message for common error strings if status is missing
  const lowerMsg = String(message).toLowerCase();
  if (lowerMsg.includes('api key') && (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect'))) {
      return { status: 'invalid', error: message };
  }
  if (lowerMsg.includes('quota') || lowerMsg.includes('rate limit')) {
      return { status: 'ratelimited', error: message };
  }

  return { status: 'invalid', error: message };
};

/**
 * Validates an API key for a specific provider by making a minimal request (1 token).
 */
export const validateApiKey = async (provider: AIProvider, apiKey: string): Promise<ValidationResult> => {
  if (!apiKey || !apiKey.trim()) {
    return { status: 'invalid', error: 'API Key is empty' };
  }

  try {
    switch (provider) {
      case AIProvider.Google: {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'test',
        });
        return { status: 'valid' };
      }

      case AIProvider.OpenAI: {
        const openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true 
        });
        await openai.chat.completions.create({
          messages: [{ role: 'user', content: 'test' }],
          model: 'gpt-3.5-turbo',
          max_tokens: 1,
        });
        return { status: 'valid' };
      }

      case AIProvider.OpenRouter: {
        const openai = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'HTTP-Referer': window.location.href,
            'X-Title': 'SFL Prompt Studio'
          }
        });
        // Use a cheap/free model for validation if possible, or a standard one
        await openai.chat.completions.create({
          messages: [{ role: 'user', content: 'test' }],
          model: 'openai/gpt-3.5-turbo', 
          max_tokens: 1,
        });
        return { status: 'valid' };
      }

      case AIProvider.Anthropic: {
        // Using fetch for lightweight validation and to avoid package conflicts in browser
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'dangerously-allow-browser': 'true' // Anthropic specific
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }]
            })
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw { status: response.status, message: errorBody?.error?.message || response.statusText };
        }
        return { status: 'valid' };
      }

      case AIProvider.Mistral: {
        // Using fetch for lightweight validation
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }]
            })
        });

        if (!response.ok) {
             const errorBody = await response.json().catch(() => ({}));
             throw { status: response.status, message: errorBody?.message || response.statusText };
        }
        return { status: 'valid' };
      }

      default:
        return { status: 'invalid', error: `Unsupported provider: ${provider}` };
    }
  } catch (error: any) {
    return mapErrorToStatus(error);
  }
};
