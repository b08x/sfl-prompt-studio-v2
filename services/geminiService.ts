
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { PromptSFL, Workflow } from '../types';

// Helper function to get a configured AI instance, ensuring API key exists.
const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is not configured. Please ensure the API_KEY environment variable is set.");
    }
    return new GoogleGenAI({ apiKey });
};

const parseJsonFromText = (text: string) => {
  let jsonStr = text.trim();
  
  // This regex finds the first JSON code block anywhere in the text.
  // FIX: Allow for various language identifiers like 'markdown' or others.
  const fenceMatch = jsonStr.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/s);

  if (fenceMatch && fenceMatch[1]) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // If no fences, find the first complete JSON object.
    // This is more robust against extra text after the JSON.
    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace !== -1) {
      let braceCount = 0;
      let lastBrace = -1;
      for (let i = firstBrace; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') {
          braceCount++;
        } else if (jsonStr[i] === '}') {
          braceCount--;
        }
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
      if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }
  }
  
  // Attempt to fix common invalid JSON from LLMs. This is a defensive measure.
  // The primary fix should always be improving the prompt.
  // Replace ": undefined" with ": null"
  jsonStr = jsonStr.replace(/:(\s*)undefined\b/g, ':$1null');
  // Remove trailing commas from objects and arrays
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  // Sanitize newlines and other control characters inside strings.
  // This is a fallback for cases where the LLM produces invalid JSON strings.
  let sanitizedJsonStr = '';
  let inString = false;
  let isEscaped = false;
  for (const char of jsonStr) {
      if (inString) {
          if (isEscaped) {
              sanitizedJsonStr += char;
              isEscaped = false;
          } else if (char === '\\') {
              sanitizedJsonStr += char;
              isEscaped = true;
          } else if (char === '"') {
              sanitizedJsonStr += char;
              inString = false;
          } else if (char === '\n') {
              sanitizedJsonStr += '\\n';
          } else if (char === '\r') {
              sanitizedJsonStr += '\\r';
          } else if (char === '\t') {
              sanitizedJsonStr += '\\t';
          } else {
              sanitizedJsonStr += char;
          }
      } else { // Not in a string
          if (char === '"') {
              inString = true;
          }
          sanitizedJsonStr += char;
      }
  }
  jsonStr = sanitizedJsonStr;

  try {
    const data = JSON.parse(jsonStr);
    // If sourceDocument became null, remove it so it becomes undefined in JS.
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
    
    return response.text;

  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};

export const generateSFLFromGoal = async (goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    const ai = getAiInstance();
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.
    If a source document is provided for stylistic reference, you MUST analyze its style (e.g., tone, complexity, vocabulary, sentence structure) and incorporate those stylistic qualities into the SFL fields and the final promptText. For example, update the 'desiredTone', 'aiPersona', and 'textualDirectives' to match the source. The generated 'promptText' should be a complete, standalone prompt that implicitly carries the desired style.
    The output MUST be a single, valid JSON object. Do not include any text, notes, or explanations outside of the JSON object.
    All string values in the JSON, especially for multi-line fields like "promptText", must be properly formatted with escaped newlines (e.g., using \\n).
    The JSON object should have the following structure: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.
    
    - title: Create a concise, descriptive title based on the user's goal.
    - promptText: Synthesize all the SFL elements into a complete, well-formed prompt that can be sent directly to an AI.
    - sflField (What is happening?): Analyze the subject matter.
    - sflTenor (Who is taking part?): Define the roles and relationships. The "targetAudience" field must be an array of strings, even if only one audience is identified.
    - sflMode (How is it being communicated?): Specify the format and structure of the output.
    - exampleOutput: Provide a brief but illustrative example of the expected output.
    - notes: Add any relevant notes or suggestions for the user.
    - All fields in the JSON must be filled with a string (or array of strings for targetAudience). If no information can be derived for a field, provide an empty string "" or a sensible default.
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
            },
        });

        const text = response.text;
        const jsonData = parseJsonFromText(text);
        
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
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
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to revise an existing SFL prompt based on a user's suggestion.
    The user will provide a JSON object representing the current prompt and a text string with their requested change.
    If a source document is provided (as part of the prompt object or separately), its style should be analyzed and take precedence, influencing the revision.
    You MUST return a single, valid JSON object that represents the *revised* prompt. Do not include any text, notes, or explanations outside of the JSON object.
    All string values in the JSON, especially for multi-line fields like "promptText", must be properly formatted with escaped newlines (e.g., using \\n).
    The output JSON object must have the exact same structure as the input, containing all the original fields, but with values updated according to the suggestion and stylistic source.
    The structure is: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string, "sourceDocument"?: { "name": string, "content": string } }.
    
    - Critically analyze the user's suggestion and apply it to all relevant fields in the prompt.
    - If a 'sourceDocument' is present, ensure its style is reflected in the revised SFL fields and 'promptText'.
    - The 'promptText' field is the most important; it must be re-written to reflect the change.
    - Other SFL fields (Field, Tenor, Mode) should be updated logically to align with the new 'promptText' and the user's suggestion.
    - Even update the 'title', 'exampleOutput', and 'notes' if the suggestion implies it.
    - Ensure 'targetAudience' remains an array of strings.
    - If a 'sourceDocument' was present in the input, preserve it in the output. If it was not present, you MUST OMIT the 'sourceDocument' key from the output JSON object entirely.
    - All fields must be filled. If no information can be derived for a field, provide an empty string "" or a sensible default, but try to keep existing data if it's still relevant.
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(promptForPayload)}
    
    ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Here is my suggestion for how to change it:
    "${suggestion}"

    Now, provide the complete, revised JSON object.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        const jsonData = parseJsonFromText(text);
        
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
        }
        
        // Preserve the source document from the original prompt
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

export const generateWorkflowFromGoal = async (goal: string): Promise<Workflow> => {
    const ai = getAiInstance();

    const systemInstruction = `You are an expert AI workflow orchestrator. Your task is to analyze a user's goal and generate a complete, multi-task workflow as a valid JSON object.
    
The user goal will be provided. Based on this, create a workflow with a series of tasks. The output MUST be a single, valid JSON object representing the workflow. Do not include any text or explanations outside the JSON.
All string values in the JSON, especially for multi-line fields like "promptTemplate", must be properly formatted with escaped newlines (e.g., using \\n).

The root JSON object must have 'name', 'description', and 'tasks' fields. Each task in the 'tasks' array must have the following fields:
- id: A unique string identifier for the task (e.g., "task-1").
- name: A short, descriptive name for the task.
- description: A one-sentence explanation of what the task does.
- type: One of "DATA_INPUT", "GEMINI_PROMPT", "IMAGE_ANALYSIS", "TEXT_MANIPULATION", "DISPLAY_CHART", "GEMINI_GROUNDED".
- dependencies: An array of task IDs that this task depends on. Empty for initial tasks.
- inputKeys: An array of strings representing keys from the Data Store needed for this task. Use dot notation for nested keys (e.g., "userInput.text").
- outputKey: A string for the key where the task's result will be stored in the Data Store.

Rules for specific task types:
- GEMINI_PROMPT/IMAGE_ANALYSIS: Must include a 'promptTemplate' field. Use {{key}} for placeholders.
- TEXT_MANIPULATION: Must include a 'functionBody' field containing a JavaScript function body as a string. E.g., "return \`Report: \${inputs.summary}\`".
- DATA_INPUT: Must include a 'staticValue' field. Use "{{userInput.text}}", "{{userInput.image}}", or "{{userInput.file}}" to get data from the user input area.
- DISPLAY_CHART: Must include a 'dataKey' field pointing to data in the Data Store suitable for charting.
- GEMINI_GROUNDED: For tasks requiring up-to-date information. Should have a 'promptTemplate'.

Example Goal: "Analyze a user-provided text for sentiment and then summarize it."
Example Output:
{
  "name": "Sentiment Analysis and Summary",
  "description": "Analyzes a piece of text for its sentiment and provides a summary.",
  "tasks": [
    {
      "id": "task-1", "name": "Get User Text", "description": "Receives text from user input.", "type": "DATA_INPUT",
      "dependencies": [], "inputKeys": ["userInput.text"], "outputKey": "articleText", "staticValue": "{{userInput.text}}"
    },
    {
      "id": "task-2", "name": "Analyze Sentiment", "description": "Performs sentiment analysis.", "type": "GEMINI_PROMPT",
      "dependencies": ["task-1"], "inputKeys": ["articleText"], "outputKey": "sentimentResult",
      "promptTemplate": "What is the sentiment of this text? {{articleText}}"
    },
    {
      "id": "task-3", "name": "Summarize Text", "description": "Summarizes the text.", "type": "GEMINI_PROMPT",
      "dependencies": ["task-1"], "inputKeys": ["articleText"], "outputKey": "summaryResult",
      "promptTemplate": "Summarize this: {{articleText}}"
    }
  ]
}

Now, generate the workflow for the user's goal.
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User's goal: "${goal}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        const jsonData = parseJsonFromText(text);
        
        // Basic validation
        if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
            throw new Error("Generated workflow is missing required fields (name, description, tasks).");
        }
        
        // Add a random ID to the workflow
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
