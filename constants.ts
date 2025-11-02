import { SFLField, SFLTenor, SFLMode, PromptSFL, Workflow, TaskType } from './types';

export const TASK_TYPES = [
  "Explanation", "Summarization", "Code Generation", "Creative Writing", 
  "Translation", "Brainstorming", "Question Answering", "Data Analysis", 
  "Comparison", "Instruction", "Dialogue Generation", "Outline Creation"
];

export const AI_PERSONAS = [
  "Expert", "Friendly Assistant", "Sarcastic Bot", "Neutral Reporter", 
  "Creative Muse", "Teacher/Tutor", "Devil's Advocate", "Philosopher", "Historian"
];

export const TARGET_AUDIENCES = [
  "General Public", "Beginners", "Intermediates", "Experts", "Children (5-7 years)", 
  "Teenagers (13-17 years)", "Software Developers", "Academic Researchers", 
  "Business Professionals", "Policy Makers"
];

export const DESIRED_TONES = [
  "Formal", "Informal", "Humorous", "Serious", "Empathetic", "Concise", 
  "Detailed", "Persuasive", "Objective", "Enthusiastic", "Critical", "Neutral"
];

export const OUTPUT_FORMATS = [
  "Plain Text", "Markdown", "JSON", "XML", "Python Code", "JavaScript Code", 
  "HTML", "Bullet Points", "Numbered List", "Poem", "Short Story", "Email", 
  "Report", "Spreadsheet (CSV-like)", "Slide Presentation Outline"
];

export const LENGTH_CONSTRAINTS = [
  "Single Sentence", "Short Paragraph (~50 words)", "Medium Paragraph (~150 words)", 
  "Long Paragraph (~300 words)", "Multiple Paragraphs (~500+ words)", 
  "Concise (as needed)", "Detailed (as needed)", "No Specific Limit"
];

export const POPULAR_TAGS = ["#summarization", "#expert-persona", "#python-code", "#formal-tone", "#technical", "#json"];

export const SFL_EMPTY_FIELD: SFLField = {
  topic: "", taskType: TASK_TYPES[0] || "", domainSpecifics: "", keywords: ""
};
export const SFL_EMPTY_TENOR: SFLTenor = {
  aiPersona: AI_PERSONAS[0] || "", targetAudience: [], 
  desiredTone: DESIRED_TONES[0] || "", interpersonalStance: ""
};
export const SFL_EMPTY_MODE: SFLMode = {
  outputFormat: OUTPUT_FORMATS[0] || "", rhetoricalStructure: "", 
  lengthConstraint: LENGTH_CONSTRAINTS[0] || "", textualDirectives: ""
};

export const INITIAL_PROMPT_SFL: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'> = {
  title: "",
  promptText: "",
  sflField: { ...SFL_EMPTY_FIELD },
  sflTenor: { ...SFL_EMPTY_TENOR },
  sflMode: { ...SFL_EMPTY_MODE },
  exampleOutput: "",
  notes: "",
  sourceDocument: undefined,
  version: 1,
  history: [],
};

// --- PROMPT LAB CONSTANTS ---

export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-default-1",
    name: "Analyze and Summarize Article",
    description: "Takes an article from user input, analyzes its sentiment, and provides a concise summary.",
    isDefault: true,
    tasks: [
      {
        id: "task-1",
        name: "User Input Article",
        description: "Accepts the article text from the user.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.text'],
        outputKey: 'articleText',
        staticValue: "{{userInput.text}}",
      },
      {
        id: "task-2",
        name: "Sentiment Analysis",
        description: "Analyzes the sentiment of the article.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["task-1"],
        inputKeys: ["articleText"],
        outputKey: "sentiment",
        promptTemplate: "Analyze the sentiment of the following article and classify it as POSITIVE, NEGATIVE, or NEUTRAL. Return only the classification. Article: {{articleText}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.1 }
      },
      {
        id: "task-3",
        name: "Generate Summary",
        description: "Creates a 3-sentence summary of the article.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["task-1"],
        inputKeys: ["articleText"],
        outputKey: "summary",
        promptTemplate: "Summarize the following article in three concise sentences. Article: {{articleText}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.7 }
      },
      {
        id: "task-4",
        name: "Format Final Report",
        description: "Combines the summary and sentiment into a final report.",
        type: TaskType.TEXT_MANIPULATION,
        dependencies: ["task-2", "task-3"],
        inputKeys: ["summary", "sentiment"],
        outputKey: "finalReport",
        functionBody: "return `Sentiment: ${inputs.sentiment}\\n\\nSummary:\\n${inputs.summary}`"
      }
    ]
  },
  {
    id: "wf-default-2",
    name: "Image Content Description",
    description: "Accepts an image, describes its contents, and suggests social media captions.",
    isDefault: true,
    tasks: [
      {
        id: "img-task-1",
        name: "User Input Image",
        description: "Accepts an image from the user.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.image'],
        outputKey: 'userImage',
        staticValue: "{{userInput.image}}",
      },
      {
        id: "img-task-2",
        name: "Describe Image Content",
        description: "Generates a detailed description of the uploaded image.",
        type: TaskType.IMAGE_ANALYSIS,
        dependencies: ["img-task-1"],
        inputKeys: ["userImage"],
        outputKey: "imageDescription",
        promptTemplate: "Describe the contents of this image in detail.",
        agentConfig: { model: 'gemini-2.5-flash' }
      },
      {
        id: "img-task-3",
        name: "Suggest Social Media Captions",
        description: "Generates 3 social media captions based on the image description.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["img-task-2"],
        inputKeys: ["imageDescription"],
        outputKey: "captions",
        promptTemplate: "Based on the following description of an image, generate 3 creative and engaging social media captions. Image description: {{imageDescription}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.8 }
      }
    ]
  },
  {
    id: "wf-default-3",
    name: "Code Debugger Assistant",
    description: "Accepts an issue description and a code file, analyzes the problem, and proposes a fix.",
    isDefault: true,
    tasks: [
      {
        id: "debug-task-1",
        name: "Get Reported Issue Description",
        description: "Accepts the issue description from the user's text input.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.text'],
        outputKey: 'issueDescription',
        staticValue: "{{userInput.text}}",
      },
      {
        id: "debug-task-2",
        name: "Get Codebase From File",
        description: "Accepts the code file from the user's file upload.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.file.content'],
        outputKey: 'codebaseText',
        staticValue: "{{userInput.file.content}}",
      },
      {
        id: "debug-task-3",
        name: "Analyze Code and Debug Issue",
        description: "Analyzes the code and the issue to find the root cause.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["debug-task-1", "debug-task-2"],
        inputKeys: ["issueDescription", "codebaseText"],
        outputKey: "analysis",
        promptTemplate: "Please analyze the following code based on the issue described. Identify the root cause of the problem and explain it clearly.\n\nISSUE DESCRIPTION:\n{{issueDescription}}\n\nCODEBASE:\n```\n{{codebaseText}}\n```",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.2 }
      },
      {
        id: "debug-task-4",
        name: "Propose Concrete Code Fix",
        description: "Generates a corrected version of the code.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["debug-task-3", "debug-task-2"],
        inputKeys: ["analysis", "codebaseText"],
        outputKey: "codeFix",
        promptTemplate: "Based on the following analysis and original code, provide a corrected version of the code. Only output the corrected code block with clear comments on the changes. Do not include any other explanations outside of the code block.\n\nANALYSIS:\n{{analysis}}\n\nORIGINAL CODE:\n```\n{{codebaseText}}\n```",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.5 }
      }
    ]
  },
  {
    id: "wf-perlocutionary-default",
    name: "Perlocutionary Effect Forecaster",
    description: "Analyzes obfuscated communication from text, a file, or an image to forecast social and emotional fallout, calculating key risk metrics.",
    isDefault: true,
    tasks: [
      {
        id: "pef-task-1",
        name: "Analyze Image Content",
        description: "If an image is provided, analyzes its content for potential hidden meaning or sentiment.",
        type: TaskType.IMAGE_ANALYSIS,
        dependencies: [],
        inputKeys: ["userInput.image?"],
        outputKey: "imageAnalysisResult",
        promptTemplate: "Thoroughly describe the visual elements and any text in this image. Focus on aspects that could convey subtle, indirect, or emotionally-charged messages. What is the potential perlocutionary effect of this image?",
        agentConfig: { model: 'gemini-2.5-flash' }
      },
      {
        id: "pef-task-2",
        name: "Capture Obfuscated Prompt",
        description: "Consolidates input from text, a file, or image analysis into a single prompt for forecasting.",
        type: TaskType.TEXT_MANIPULATION,
        dependencies: ["pef-task-1"],
        inputKeys: ["userInput.text?", "userInput.file.content?", "imageAnalysisResult?"],
        outputKey: "obfuscatedPrompt",
        functionBody: "return inputs.text || inputs.content || inputs.imageAnalysisResult || 'No input provided. Please provide text, a file, or an image.';"
      },
      {
        id: "pef-task-3",
        name: "Forecast Perlocutionary Effects",
        description: "Analyzes the obfuscated text to predict its social and emotional impact and calculate specific risk metrics.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["pef-task-2"],
        inputKeys: ["obfuscatedPrompt"],
        outputKey: "perlocutionaryMetrics",
        promptTemplate: `Given the following potentially obfuscated communication, analyze its perlocutionary effects. Identify the likely emotional responses (e.g., anger, confusion, reassurance) and social consequences (e.g., loss of trust, increased cohesion, conflict initiation). Output your analysis as a JSON object with keys "emotional_responses" (an array of strings) and "social_consequences" (an array of strings).\n\nCommunication:\n"{{obfuscatedPrompt}}"`,
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.3 }
      },
      {
        id: "pef-task-4",
        name: "Generate Risk Assessment Report",
        description: "Compiles the forecasted perlocutionary effects and risk metrics into a structured report.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["pef-task-3"],
        inputKeys: ["perlocutionaryMetrics", "obfuscatedPrompt"],
        outputKey: "riskAssessmentReport",
        promptTemplate: `Based on the following analysis of perlocutionary effects, generate a concise risk assessment report in Markdown format. The report should summarize the findings and assign a risk level (Low, Medium, High).\n\nOriginal Communication:\n"{{obfuscatedPrompt}}"\n\nAnalysis:\n{{perlocutionaryMetrics}}`,
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.5 }
      }
    ]
  }
];