
import { PromptSFL, SFLAnalysis } from '../types';
import { geminiProvider } from './providers/GeminiProvider';
import { Type } from "@google/genai";

// Schema definitions
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score from 0 to 100." },
    assessment: { type: Type.STRING, description: "Brief summary." },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['error', 'warning', 'info'] },
          component: { type: Type.STRING },
          message: { type: Type.STRING },
          suggestion: { type: Type.STRING }
        },
        required: ['severity', 'component', 'message', 'suggestion']
      }
    }
  },
  required: ['score', 'assessment', 'issues']
};

export const generateSFLFromGoal = async (goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Structure the user's goal into a detailed SFL-based prompt.
    If a source document is provided, analyze its style and incorporate it.
    Output MUST be a single JSON object: { "title", "promptText", "sflField", "sflTenor", "sflMode", "exampleOutput", "notes" }.
    - sflField: { topic, taskType, domainSpecifics, keywords }
    - sflTenor: { aiPersona, targetAudience (array), desiredTone, interpersonalStance }
    - sflMode: { outputFormat, rhetoricalStructure, lengthConstraint, textualDirectives }
    `;
    
    const userContent = sourceDocContent
      ? `Source document for style reference:\n---\n${sourceDocContent}\n---\nUser's goal: "${goal}"`
      : `Here is the user's goal: "${goal}"`;

    const jsonData = await geminiProvider.generateJSON<any>(userContent, undefined, { systemInstruction });
    
    // Normalization
    if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
        jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
    }
    if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
        jsonData.sflTenor.targetAudience = [];
    }
    return jsonData;
};

export const regenerateSFLFromSuggestion = async (
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
    suggestion: string
): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const systemInstruction = `You are an expert in SFL and prompt engineering. Revise the existing SFL prompt based on the user's suggestion.
    Return a single JSON object with the exact same structure as the input. Update fields logically.
    Structure: { "title", "promptText", "sflField", "sflTenor", "sflMode", "exampleOutput", "notes", "sourceDocument"? }.
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Current prompt JSON: ${JSON.stringify(promptForPayload)}
    ${sourceDocument ? `Source doc style ref:\n---\n${sourceDocument.content}\n---\n` : ''}
    Suggestion: "${suggestion}"
    Provide revised JSON.
    `;

    const jsonData = await geminiProvider.generateJSON<any>(userContent, undefined, { systemInstruction });

    if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
        jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
    }
    jsonData.sourceDocument = sourceDocument;
    
    return jsonData;
};

export const analyzeSFL = async (prompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>): Promise<SFLAnalysis> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geminiResponse, geminiTestError, isTesting, ...promptData } = prompt;
    
    const systemInstruction = `Analyze this SFL prompt for clarity, coherence, and conflicts (Functional, Generative, Pragmatic Grammar). Return a JSON object with score, assessment, and issues.`;

    try {
        return await geminiProvider.generateJSON<SFLAnalysis>(
            `Analyze components:\n${JSON.stringify(promptData, null, 2)}`,
            analysisSchema,
            { model: 'gemini-2.5-pro', systemInstruction }
        );
    } catch (error) {
        console.error("Analysis failed", error);
        return {
            score: 0,
            assessment: "Failed to analyze prompt.",
            issues: [{ severity: 'error', component: 'System', message: 'Analysis service failed.', suggestion: 'Try again later.' }]
        };
    }
};

export const testPrompt = async (promptText: string): Promise<string> => {
    return await geminiProvider.generateText(promptText);
};
