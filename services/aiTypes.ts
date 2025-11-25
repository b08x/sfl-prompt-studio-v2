
import { Part, LiveConnectConfig } from "@google/genai";

// LiveSession is not exported by the SDK currently, so we use any.
export type LiveSession = any;

export interface AIConfig {
    model?: string;
    temperature?: number;
    topK?: number;
    topP?: number;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
}

export interface AIProvider {
    generateText(prompt: string, config?: AIConfig): Promise<string>;
    generateJSON<T>(prompt: string, schema?: any, config?: AIConfig): Promise<T>;
    generateImageAnalysis(prompt: string, imagePart: Part, config?: AIConfig): Promise<string>;
    generateGroundedContent(prompt: string, config?: AIConfig): Promise<{ text: string; sources: any[] }>;
    connectLive(model: string, config: LiveConnectConfig, callbacks: any): Promise<LiveSession>;
}
