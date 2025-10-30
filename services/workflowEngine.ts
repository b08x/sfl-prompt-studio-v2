import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Task, DataStore, AgentConfig, PromptSFL } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

// Helper to safely get nested properties from an object
const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const templateString = (template: string, dataStore: DataStore): any => {
    // Check if the template is ONLY a single variable placeholder
    const singleVarMatch = template.trim().match(/^\{\{\s*([\w\.]+)\s*\}\}$/);
    if (singleVarMatch) {
        const key = singleVarMatch[1];
        const value = getNested(dataStore, key);
        // If it's a single variable, return the raw value, which might be an object
        return value !== undefined ? value : template;
    }

    // Otherwise, it's a mixed string, so replace all variables with their string representations
    return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
        const value = getNested(dataStore, key);
        if (value === undefined || value === null) {
            console.warn(`Template key "${key}" not found in data store.`);
            return match; // Keep the placeholder if value not found
        }
        // If a value is an object, stringify it for embedding in the larger string
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    });
};


const executeGeminiPrompt = async (prompt: string, agentConfig?: AgentConfig) => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: agentConfig?.systemInstruction,
            temperature: agentConfig?.temperature,
            topK: agentConfig?.topK,
            topP: agentConfig?.topP,
        }
    });
    return response.text;
};

const executeImageAnalysis = async (prompt: string, imagePart: Part, agentConfig?: AgentConfig) => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: { parts: [textPart, imagePart] },
        config: {
            systemInstruction: agentConfig?.systemInstruction,
            temperature: agentConfig?.temperature,
        }
    });

    return response.text;
};

const executeGroundedGeneration = async (prompt: string, agentConfig?: AgentConfig) => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: agentConfig?.systemInstruction,
            temperature: agentConfig?.temperature,
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
};


const executeTextManipulation = (funcBody: string, inputs: Record<string, any>): any => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    } catch (e: any) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};

export const executeTask = async (task: Task, dataStore: DataStore, prompts: PromptSFL[]): Promise<any> => {
    const inputs: Record<string, any> = {};
    for (const key of task.inputKeys) {
        const isOptional = key.endsWith('?');
        const actualKey = isOptional ? key.slice(0, -1) : key;
        const value = getNested(dataStore, actualKey);

        if (value !== undefined) {
            inputs[actualKey] = value;
        } else if (!isOptional) {
             throw new Error(`Missing required input key "${actualKey}" in data store for task "${task.name}".`);
        }
    }
    
    // For TEXT_MANIPULATION, we pass an object of all resolved inputs with simplified keys
    const resolvedInputs = Object.entries(inputs).reduce((acc, [fullKey, value]) => {
        const simpleKey = fullKey.split('.').pop() || fullKey;
        acc[simpleKey] = value;
        return acc;
    }, {} as Record<string, any>);


    switch (task.type) {
        case 'DATA_INPUT':
            if (task.staticValue && typeof task.staticValue === 'string') {
                return templateString(task.staticValue, dataStore);
            }
            return task.staticValue;

        case 'GEMINI_PROMPT': {
            if (task.promptId) {
                const linkedPrompt = prompts.find(p => p.id === task.promptId);
                if (!linkedPrompt) {
                    throw new Error(`Task "${task.name}" has a linked prompt with ID "${task.promptId}" that was not found in the library.`);
                }
                
                const { sflTenor, sflMode } = linkedPrompt;
                
                // Build a system instruction from SFL data
                const instructionParts = [];
                if (sflTenor.aiPersona) instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                if (sflTenor.desiredTone) instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                if (sflTenor.targetAudience?.length) instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                if (sflMode.textualDirectives) instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                
                const systemInstruction = instructionParts.join(' ');
                
                const finalPromptText = templateString(linkedPrompt.promptText, dataStore);
                const finalAgentConfig = { ...task.agentConfig, systemInstruction };
                
                return executeGeminiPrompt(finalPromptText, finalAgentConfig);

            } else {
                 if (!task.promptTemplate) throw new Error("Prompt template is missing for non-linked prompt task.");
                const finalPrompt = templateString(task.promptTemplate, dataStore);
                return executeGeminiPrompt(finalPrompt, task.agentConfig);
            }
        }
        
        case 'GEMINI_GROUNDED':
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");
            const groundedPrompt = templateString(task.promptTemplate, dataStore);
            return executeGroundedGeneration(groundedPrompt, task.agentConfig);

        case 'IMAGE_ANALYSIS': {
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");

            // Assume the first input key points to the image data object.
            const imageInputKeyWithOptional = task.inputKeys[0];
            if (!imageInputKeyWithOptional) {
                throw new Error("IMAGE_ANALYSIS task must have at least one input key pointing to the image data.");
            }
            
            const imageInputKey = imageInputKeyWithOptional.endsWith('?') ? imageInputKeyWithOptional.slice(0, -1) : imageInputKeyWithOptional;
            
            const imageData = inputs[imageInputKey];
            if (!imageData || typeof imageData.base64 !== 'string' || typeof imageData.type !== 'string') {
                // Gracefully handle missing optional image
                if (imageInputKeyWithOptional.endsWith('?')) {
                    return ""; // Return empty string for missing optional image
                }
                throw new Error(`Image data from key "${imageInputKey}" is missing, malformed, or not found in inputs.`);
            }

            const imagePart: Part = {
                inlineData: {
                    data: imageData.base64,
                    mimeType: imageData.type,
                },
            };

            // The prompt template itself can also contain variables from the data store.
            const analysisPrompt = templateString(task.promptTemplate, dataStore);
            return executeImageAnalysis(analysisPrompt, imagePart, task.agentConfig);
        }

        case 'TEXT_MANIPULATION':
            if (!task.functionBody) throw new Error("Function body is missing.");
            return executeTextManipulation(task.functionBody, resolvedInputs);

        case 'SIMULATE_PROCESS':
            return new Promise(resolve => {
                setTimeout(() => resolve({ status: "ok", message: `Simulated process for ${task.name} completed.`}), 1000)
            });
        
        case 'DISPLAY_CHART':
             // This task doesn't "execute" in the same way. It just signals the UI to render something.
             // The runner can just pass through the data.
             if(!task.dataKey) throw new Error("Data key is missing for chart display.");
             return getNested(dataStore, task.dataKey);

        default:
            throw new Error(`Unsupported task type: ${task.type}`);
    }
};

export const topologicalSort = (tasks: Task[]): { sortedTasks: Task[], feedback: string[] } => {
    const sortedTasks: Task[] = [];
    const feedback: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    function visit(taskId: string) {
        if (recursionStack.has(taskId)) {
            feedback.push(`Cycle detected in workflow involving task ID: ${taskId}`);
            return;
        }
        if (visited.has(taskId)) {
            return;
        }

        visited.add(taskId);
        recursionStack.add(taskId);

        const task = taskMap.get(taskId);
        if (task) {
            for (const depId of task.dependencies) {
                if (taskMap.has(depId)) {
                    visit(depId);
                } else {
                    feedback.push(`Warning: Task "${task.name}" has an unknown dependency: "${depId}". It will be ignored.`);
                }
            }
            sortedTasks.push(task);
        }
        
        recursionStack.delete(taskId);
    }

    for (const task of tasks) {
        if (!visited.has(task.id)) {
            visit(task.id);
        }
    }
    
    if(feedback.some(f => f.includes('Cycle detected'))) {
       return { sortedTasks: [], feedback };
    }

    return { sortedTasks, feedback };
};