
import { generateText } from 'ai';
import { getVercelModel } from './providerFactory';
import { AIProvider } from '../types/ai';
import { AgentConfig } from '../types';

export interface ExecutionOptions {
    provider: AIProvider;
    model: string;
    apiKey: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    systemInstruction?: string;
}

/**
 * Unified text generation service using Vercel AI SDK
 * Supports all providers: Google, OpenAI, Anthropic, OpenRouter, Mistral
 */
export const generateTextUnified = async (
    prompt: string,
    options: ExecutionOptions
): Promise<string> => {
    const {
        provider,
        model,
        apiKey,
        temperature = 0.7,
        topP = 0.9,
        topK = 40,
        maxTokens = 4096,
        systemInstruction,
    } = options;

    if (!apiKey) {
        throw new Error(`Missing API key for provider: ${provider}`);
    }

    try {
        const vercelModel = getVercelModel(provider, apiKey, model);

        const result = await generateText({
            model: vercelModel,
            prompt,
            system: systemInstruction,
            temperature,
            topP,
            topK,
            maxTokens,
        });

        return result.text;
    } catch (error: any) {
        console.error(`Error generating text with ${provider}/${model}:`, error);

        // Provide more helpful error messages
        if (error.message?.includes('API key')) {
            throw new Error(`Invalid API key for ${provider}`);
        }
        if (error.message?.includes('rate limit')) {
            throw new Error(`Rate limit exceeded for ${provider}`);
        }
        if (error.message?.includes('not found')) {
            throw new Error(`Model ${model} not found for ${provider}`);
        }

        throw new Error(`Failed to generate text: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Helper to convert AgentConfig to ExecutionOptions
 */
export const agentConfigToExecutionOptions = (
    agentConfig: AgentConfig | undefined,
    apiKey: string,
    defaultProvider: AIProvider,
    defaultModel: string
): ExecutionOptions => {
    return {
        provider: (agentConfig?.provider as AIProvider) || defaultProvider,
        model: agentConfig?.model || defaultModel,
        apiKey,
        temperature: agentConfig?.temperature,
        topP: agentConfig?.topP,
        topK: agentConfig?.topK,
        systemInstruction: agentConfig?.systemInstruction,
    };
};

/**
 * Generate structured JSON output
 * Note: Not all providers support JSON mode equally
 */
export const generateJSONUnified = async <T = any>(
    prompt: string,
    options: ExecutionOptions
): Promise<T> => {
    const {
        provider,
        model,
        apiKey,
        temperature = 0.7,
        topP = 0.9,
        maxTokens = 4096,
        systemInstruction,
    } = options;

    if (!apiKey) {
        throw new Error(`Missing API key for provider: ${provider}`);
    }

    try {
        const vercelModel = getVercelModel(provider, apiKey, model);

        // For JSON generation, we'll use generateText with instructions
        const jsonPrompt = systemInstruction
            ? `${systemInstruction}\n\nRespond with valid JSON only.\n\n${prompt}`
            : `Respond with valid JSON only.\n\n${prompt}`;

        const result = await generateText({
            model: vercelModel,
            prompt: jsonPrompt,
            temperature,
            topP,
            maxTokens,
        });

        // Try to parse the response as JSON
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Response did not contain valid JSON');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
        console.error(`Error generating JSON with ${provider}/${model}:`, error);
        throw new Error(`Failed to generate JSON: ${error.message || 'Unknown error'}`);
    }
};
