
import { Workflow, TaskType } from '../types';
import { geminiProvider } from './providers/GeminiProvider';
import { Type } from "@google/genai";

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
    const systemInstruction = `You are an AI workflow orchestrator. Generate a multi-task workflow JSON from the user's goal.
    
    Ensure tasks are logically connected via 'dependencies' and 'inputKeys'/'outputKey' data flow.
    - Use 'GEMINI_PROMPT' for general AI tasks.
    - Use 'DATA_INPUT' for receiving user inputs.
    - Use 'TEXT_MANIPULATION' for formatting results.
    - Ensure unique IDs for tasks.
    `;

    const jsonData = await geminiProvider.generateJSON<Workflow>(`User's goal: "${goal}"`, workflowSchema, { systemInstruction });
    
    if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
        throw new Error("Generated workflow is invalid.");
    }
    jsonData.id = `wf-custom-${crypto.randomUUID().slice(0, 8)}`;
    
    return jsonData;
};
