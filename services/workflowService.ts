
import { Workflow } from '../types';
import { geminiProvider } from './providers/GeminiProvider';

export const generateWorkflowFromGoal = async (goal: string): Promise<Workflow> => {
    const systemInstruction = `You are an AI workflow orchestrator. Generate a multi-task workflow JSON from the user's goal.
    Root object: { "name", "description", "tasks": [] }.
    Tasks: { "id", "name", "description", "type", "dependencies" (array of IDs), "inputKeys" (array), "outputKey", "promptTemplate"?, "staticValue"?, "functionBody"?, "dataKey"? }.
    Task Types: DATA_INPUT, GEMINI_PROMPT, IMAGE_ANALYSIS, TEXT_MANIPULATION, DISPLAY_CHART, GEMINI_GROUNDED.
    `;

    const jsonData = await geminiProvider.generateJSON<Workflow>(`User's goal: "${goal}"`, undefined, { systemInstruction });
    
    if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
        throw new Error("Generated workflow is invalid.");
    }
    jsonData.id = `wf-custom-${crypto.randomUUID().slice(0, 8)}`;
    
    return jsonData;
};
