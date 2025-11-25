import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PromptSFL, Workflow } from '../types';

// Helper function to get a configured AI instance, ensuring API key exists.
const getAiInstance = () => {
    // According to guidelines, API key must be obtained from process.env.API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * @deprecated Use Gemini's responseSchema instead.
 */
export const parseJsonFromText = (text: string) => {
  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/s);
  if (fenceMatch && fenceMatch[1]) {
    jsonStr = fenceMatch[1].trim();
  } else {
    const firstBracket = jsonStr.indexOf('[');
    const firstBrace = jsonStr.indexOf('{');
    let startIndex = -1;
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIndex = firstBracket;
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    }
    if (startIndex > -1) {
        const lastBracket = jsonStr.lastIndexOf(']');
        const lastBrace = jsonStr.lastIndexOf('}');
        const endIndex = jsonStr[startIndex] === '[' ? lastBracket : lastBrace;
        if (endIndex > startIndex) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        } else {
            jsonStr = jsonStr.substring(startIndex);
        }
    }
  }
  jsonStr = jsonStr.replace(/\\\\n/g, '\\n');
  jsonStr = jsonStr.replace(/\\\\"/g, '\\"');
  jsonStr = jsonStr.replace(/:(\s*)undefined\b/g, ':$1null');
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    const data = JSON.parse(jsonStr);
    if (data.sourceDocument === null) {
      delete data.sourceDocument;
    }
    return data;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
};


export const testPromptWithGemini = async (promptText: string): Promise<string> => {
  const ai = getAiInstance();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });
    return response.text || '';
  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
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
    const ai = getAiInstance();
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.
    If a source document is provided, analyze its style and incorporate it.
    Adhere to the SFL framework: Field (Subject), Tenor (Participants), Mode (Format).
    `;
    
    const userContent = sourceDocContent
      ? `Source document for style reference:\n\n---\n\n${sourceDocContent}\n\n---\n\nUser's goal: "${goal}"`
      : `Here is the user's goal: "${goal}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: sflPromptSchema,
            },
        });

        const text = response.text;
        const jsonData = JSON.parse(text || '{}');
        
        // Ensure array type
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }

        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the SFL prompt.");
    }
};

export const regenerateSFLFromSuggestion = async (
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
    suggestion: string
): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const ai = getAiInstance();
    
    const systemInstruction = `You are an expert in SFL and prompt engineering. Revise the existing SFL prompt based on the user's suggestion.
    Update the prompt fields logically to reflect the requested changes while maintaining a coherent SFL structure.
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(promptForPayload)}
    
    ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Suggestion: "${suggestion}"
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: sflPromptSchema,
            },
        });

        const text = response.text;
        const jsonData = JSON.parse(text || '{}');
        
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        
        jsonData.sourceDocument = sourceDocument;

        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL regeneration:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while regenerating the SFL prompt.");
    }
};

const workflowSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: {
                        type: Type.STRING,
                        enum: [
                            "DATA_INPUT",
                            "GEMINI_PROMPT",
                            "IMAGE_ANALYSIS",
                            "TEXT_MANIPULATION",
                            "SIMULATE_PROCESS",
                            "DISPLAY_CHART",
                            "GEMINI_GROUNDED"
                        ]
                    },
                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    inputKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                    outputKey: { type: Type.STRING },
                    promptTemplate: { type: Type.STRING, nullable: true },
                    staticValue: { type: Type.STRING, nullable: true },
                    functionBody: { type: Type.STRING, nullable: true },
                    dataKey: { type: Type.STRING, nullable: true },
                    promptId: { type: Type.STRING, nullable: true },
                    agentConfig: {
                        type: Type.OBJECT,
                        properties: {
                            model: { type: Type.STRING, nullable: true },
                            temperature: { type: Type.NUMBER, nullable: true },
                            topK: { type: Type.NUMBER, nullable: true },
                            topP: { type: Type.NUMBER, nullable: true },
                            systemInstruction: { type: Type.STRING, nullable: true }
                        },
                        nullable: true
                    }
                },
                required: ['id', 'name', 'description', 'type', 'dependencies', 'inputKeys', 'outputKey']
            }
        }
    },
    required: ['name', 'description', 'tasks']
};


export const generateWorkflowFromGoal = async (goal: string): Promise<Workflow> => {
    const ai = getAiInstance();

    const systemInstruction = `You are an expert AI workflow orchestrator. Your task is to analyze a user's goal and generate a complete, multi-task workflow as a structured JSON object.
    
    Ensure tasks are logically connected via 'dependencies' and 'inputKeys'/'outputKey'.
    - Use 'GEMINI_PROMPT' for general AI tasks.
    - Use 'DATA_INPUT' for receiving user inputs (e.g. staticValue: "{{userInput.text}}").
    - Use 'TEXT_MANIPULATION' for formatting results.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User's goal: "${goal}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: workflowSchema,
            },
        });

        const text = response.text;
        const jsonData = JSON.parse(text || '{}');
        
        jsonData.id = `wf-custom-${crypto.randomUUID().slice(0, 8)}`;

        return jsonData as Workflow;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for Workflow generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the workflow.");
    }
};