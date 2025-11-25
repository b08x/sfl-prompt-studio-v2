
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

const sflPromptSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        promptText: { type: Type.STRING },
        sflField: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                taskType: { type: Type.STRING },
                domainSpecifics: { type: Type.STRING },
                keywords: { type: Type.STRING },
            },
            required: ['topic', 'taskType', 'domainSpecifics', 'keywords']
        },
        sflTenor: {
            type: Type.OBJECT,
            properties: {
                aiPersona: { type: Type.STRING },
                targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                desiredTone: { type: Type.STRING },
                interpersonalStance: { type: Type.STRING },
            },
            required: ['aiPersona', 'targetAudience', 'desiredTone', 'interpersonalStance']
        },
        sflMode: {
            type: Type.OBJECT,
            properties: {
                outputFormat: { type: Type.STRING },
                rhetoricalStructure: { type: Type.STRING },
                lengthConstraint: { type: Type.STRING },
                textualDirectives: { type: Type.STRING },
            },
            required: ['outputFormat', 'rhetoricalStructure', 'lengthConstraint', 'textualDirectives']
        },
        exampleOutput: { type: Type.STRING },
        notes: { type: Type.STRING },
    },
    required: ['title', 'promptText', 'sflField', 'sflTenor', 'sflMode', 'exampleOutput', 'notes']
};

export const generateSFLFromGoal = async (goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Structure the user's goal into a detailed SFL-based prompt.
    If a source document is provided, analyze its style and incorporate it into the prompt parameters.
    
    Adhere to the following SFL framework in your structured output:
    - sflField (What is happening?): Analyze the subject matter.
    - sflTenor (Who is taking part?): Define the roles and relationships.
    - sflMode (What role is language playing?): Specify the format and structure of the output.
    `;
    
    const userContent = sourceDocContent
      ? `Source document for style reference:\n---\n${sourceDocContent}\n---\nUser's goal: "${goal}"`
      : `Here is the user's goal: "${goal}"`;

    const jsonData = await geminiProvider.generateJSON<any>(userContent, sflPromptSchema, { systemInstruction });
    
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
    Update the prompt fields logically to reflect the requested changes while maintaining a coherent SFL structure.
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Current prompt JSON: ${JSON.stringify(promptForPayload)}
    ${sourceDocument ? `Source doc style ref:\n---\n${sourceDocument.content}\n---\n` : ''}
    Suggestion: "${suggestion}"
    Provide revised JSON.
    `;

    const jsonData = await geminiProvider.generateJSON<any>(userContent, sflPromptSchema, { systemInstruction });

    if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
        jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
    }
    jsonData.sourceDocument = sourceDocument;
    
    return jsonData;
};

export const syncPromptTextFromSFL = async (
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>
): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. 
    Your task is to generate the textual content of a prompt based on its provided SFL metadata (Field, Tenor, Mode).
    
    1. Analyze the SFL Field, Tenor, and Mode thoroughly.
    2. Rewrite the 'promptText', 'title', and 'exampleOutput' to be perfectly consistent with these parameters.
    3. Do NOT change the SFL parameters themselves.
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Here is the SFL Metadata:
    ${JSON.stringify(promptForPayload, null, 2)}
    
    ${sourceDocument ? `Source document for style reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Generate the aligned prompt text, title, and example output.
    `;

    const jsonData = await geminiProvider.generateJSON<any>(userContent, sflPromptSchema, { systemInstruction });
    
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
