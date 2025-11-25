
import { Task, DataStore, PromptSFL, Workflow } from '../types';
import { geminiProvider } from './providers/GeminiProvider';

// Helper to safely get nested properties
const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const templateString = (template: string, dataStore: DataStore): any => {
    const singleVarMatch = template.trim().match(/^\{\{\s*([\w\.]+)\s*\}\}$/);
    if (singleVarMatch) {
        const key = singleVarMatch[1];
        const value = getNested(dataStore, key);
        return value !== undefined ? value : template;
    }
    return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
        const value = getNested(dataStore, key);
        if (value === undefined || value === null) return match;
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    });
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
            let finalPromptText = "";
            let systemInstruction: string | undefined = task.agentConfig?.systemInstruction;

            if (task.promptId) {
                const linkedPrompt = prompts.find(p => p.id === task.promptId);
                if (!linkedPrompt) throw new Error(`Linked prompt ID "${task.promptId}" not found.`);
                
                const { sflTenor, sflMode } = linkedPrompt;
                const instructionParts = [];
                if (sflTenor.aiPersona) instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                if (sflTenor.desiredTone) instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                if (sflTenor.targetAudience?.length) instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                if (sflMode.textualDirectives) instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                
                systemInstruction = instructionParts.join(' ');
                finalPromptText = templateString(linkedPrompt.promptText, dataStore);
            } else {
                 if (!task.promptTemplate) throw new Error("Prompt template is missing.");
                finalPromptText = templateString(task.promptTemplate, dataStore);
            }
            
            return geminiProvider.generateText(finalPromptText, { ...task.agentConfig, systemInstruction });
        }
        
        case 'GEMINI_GROUNDED': {
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");
            const groundedPrompt = templateString(task.promptTemplate, dataStore);
            return geminiProvider.generateGroundedContent(groundedPrompt, task.agentConfig);
        }

        case 'IMAGE_ANALYSIS': {
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");
            const imageInputKeyWithOptional = task.inputKeys[0];
            if (!imageInputKeyWithOptional) throw new Error("Missing input key for image.");
            
            const imageInputKey = imageInputKeyWithOptional.endsWith('?') ? imageInputKeyWithOptional.slice(0, -1) : imageInputKeyWithOptional;
            const imageData = inputs[imageInputKey];
            
            if (!imageData || typeof imageData.base64 !== 'string') {
                if (imageInputKeyWithOptional.endsWith('?')) return "";
                throw new Error(`Image data missing/malformed.`);
            }

            const analysisPrompt = templateString(task.promptTemplate, dataStore);
            return geminiProvider.generateImageAnalysis(analysisPrompt, { inlineData: { data: imageData.base64, mimeType: imageData.type } }, task.agentConfig);
        }

        case 'TEXT_MANIPULATION':
            if (!task.functionBody) throw new Error("Function body is missing.");
            return executeTextManipulation(task.functionBody, resolvedInputs);

        case 'SIMULATE_PROCESS':
            return new Promise(resolve => setTimeout(() => resolve({ status: "ok", message: `Simulated ${task.name}`}), 1000));
        
        case 'DISPLAY_CHART':
             if(!task.dataKey) throw new Error("Data key is missing.");
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
            feedback.push(`Cycle detected involving: ${taskId}`);
            return;
        }
        if (visited.has(taskId)) return;

        visited.add(taskId);
        recursionStack.add(taskId);

        const task = taskMap.get(taskId);
        if (task) {
            for (const depId of task.dependencies) {
                if (taskMap.has(depId)) visit(depId);
                else feedback.push(`Warning: Unknown dependency "${depId}" in "${task.name}".`);
            }
            sortedTasks.push(task);
        }
        recursionStack.delete(taskId);
    }

    for (const task of tasks) {
        if (!visited.has(task.id)) visit(task.id);
    }
    
    if(feedback.some(f => f.includes('Cycle'))) return { sortedTasks: [], feedback };
    return { sortedTasks, feedback };
};

export const validateWorkflow = (workflow: Workflow): string[] => {
    const warnings: string[] = [];
    const consumedKeys = new Set<string>();

    // Gather all consumed keys
    workflow.tasks.forEach(task => {
        task.inputKeys.forEach(key => {
            // Remove optional suffix for matching
            const cleanKey = key.endsWith('?') ? key.slice(0, -1) : key;
            consumedKeys.add(cleanKey);
        });

        // DISPLAY_CHART consumes dataKey
        if (task.type === 'DISPLAY_CHART' && task.dataKey) {
             consumedKeys.add(task.dataKey);
        }
        
        // Check staticValue for interpolations {{key}}
        if (task.staticValue) {
             const matches = task.staticValue.match(/\{\{\s*([\w\.]+)\s*\}\}/g);
             if (matches) {
                 matches.forEach((m: string) => {
                     const key = m.replace(/\{\{\s*|\s*\}\}/g, '');
                     consumedKeys.add(key);
                 });
             }
        }
    });

    // Check for Dead Ends (Tasks whose output is never consumed)
    workflow.tasks.forEach(task => {
        if (!consumedKeys.has(task.outputKey)) {
             warnings.push(`Potential Dead End: Output "${task.outputKey}" from task "${task.name}" is not used by any other task.`);
        }
    });

    return warnings;
};
