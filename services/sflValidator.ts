
import { GoogleGenAI, Type } from "@google/genai";
import { PromptSFL, SFLAnalysis } from '../types';
import { parseJsonFromText } from './geminiService';

// Helper function to get a configured AI instance
const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is not configured.");
    }
    return new GoogleGenAI({ apiKey });
};

// Define the structured JSON schema for the AI's response
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A numerical score from 0 (poor) to 100 (excellent) representing the overall quality and coherence of the prompt's SFL components."
    },
    assessment: {
      type: Type.STRING,
      description: "A brief, one-sentence summary of the prompt's quality."
    },
    issues: {
      type: Type.ARRAY,
      description: "An array of identified issues or suggestions for improvement.",
      items: {
        type: Type.OBJECT,
        properties: {
          severity: {
            type: Type.STRING,
            enum: ['error', 'warning', 'info'],
            description: "The severity level of the issue."
          },
          component: {
            type: Type.STRING,
            description: "The SFL component(s) involved (e.g., 'Tenor/Mode Conflict', 'Field')."
          },
          message: {
            type: Type.STRING,
            description: "A clear, concise description of the issue."
          },
          suggestion: {
            type: Type.STRING,
            description: "An actionable suggestion to resolve the issue."
          }
        },
        required: ['severity', 'component', 'message', 'suggestion']
      }
    }
  },
  required: ['score', 'assessment', 'issues']
};

export const analyzeSFLWithGemini = async (prompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>): Promise<SFLAnalysis> => {
    const ai = getAiInstance();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geminiResponse, geminiTestError, isTesting, ...promptData } = prompt;

    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's prompt, which is provided as a JSON object with Field, Tenor, and Mode components. Evaluate the prompt for clarity, coherence, and potential conflicts.

Your analysis must consider three grammatical aspects:
1.  **Functional Grammar:** Assess clarity and meaning. Is the topic well-defined? Do the parts logically connect to achieve the task?
2.  **Generative Grammar:** Check for structural soundness. Is the prompt unambiguous for an LLM? Could the syntax be misinterpreted?
3.  **Pragmatic Grammar:** Evaluate contextual appropriateness. Does the specified persona (Tenor) conflict with the requested format (Mode)? Is the tone suitable for the audience?

Based on your expert analysis, you MUST return a single, valid JSON object that adheres to the provided schema. The JSON object is your only output.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Analyze the following SFL prompt components:\n\n${JSON.stringify(promptData, null, 2)}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const text = response.text;
        // Use the robust, centralized parser to handle potential model inconsistencies.
        const analysisResult = parseJsonFromText(text) as SFLAnalysis;
        return analysisResult;

    } catch (error) {
        console.error("Error analyzing SFL with Gemini:", error);
        // Return a default error structure that can be displayed in the UI
        return {
            score: 0,
            assessment: "Failed to analyze prompt.",
            issues: [{
                severity: 'error',
                component: 'Analysis Service',
                message: 'The AI analysis service failed to process the request.',
                suggestion: 'This might be a temporary issue with the API. Please try again in a moment.'
            }]
        };
    }
};
