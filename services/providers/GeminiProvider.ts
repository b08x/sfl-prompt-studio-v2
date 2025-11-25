
import { GoogleGenAI, GenerateContentResponse, Part, LiveConnectConfig } from "@google/genai";
import { AIProvider, AIConfig, LiveSession } from "../aiTypes";
import { parseJsonFromText } from "../../utils/jsonUtils";

export class GeminiProvider implements AIProvider {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API Key is not configured.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async generateText(prompt: string, config?: AIConfig): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: config?.model || 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: config?.systemInstruction,
                    temperature: config?.temperature,
                    topK: config?.topK,
                    topP: config?.topP,
                }
            });
            return response.text;
        } catch (error: any) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    async generateJSON<T>(prompt: string, schema?: any, config?: AIConfig): Promise<T> {
        try {
            const response = await this.ai.models.generateContent({
                model: config?.model || 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: config?.systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: config?.temperature,
                },
            });
            return parseJsonFromText(response.text) as T;
        } catch (error: any) {
            throw new Error(`Gemini API JSON Error: ${error.message}`);
        }
    }

    async generateImageAnalysis(prompt: string, imagePart: Part, config?: AIConfig): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: config?.model || 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }, imagePart] },
                config: {
                    systemInstruction: config?.systemInstruction,
                    temperature: config?.temperature,
                }
            });
            return response.text;
        } catch (error: any) {
            throw new Error(`Gemini Image Analysis Error: ${error.message}`);
        }
    }

    async generateGroundedContent(prompt: string, config?: AIConfig): Promise<{ text: string; sources: any[] }> {
        try {
            const response = await this.ai.models.generateContent({
                model: config?.model || 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    systemInstruction: config?.systemInstruction,
                    temperature: config?.temperature,
                }
            });
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri);

            return {
                text: response.text,
                sources: sources,
            };
        } catch (error: any) {
            throw new Error(`Gemini Grounded Gen Error: ${error.message}`);
        }
    }

    async connectLive(model: string, config: LiveConnectConfig, callbacks: any): Promise<LiveSession> {
        return this.ai.live.connect({ model, config, callbacks });
    }
}

export const geminiProvider = new GeminiProvider();
