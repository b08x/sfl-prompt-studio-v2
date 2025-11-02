
export interface SFLField {
  topic: string;
  taskType: string;
  domainSpecifics: string;
  keywords: string; // comma-separated
}

export interface SFLTenor {
  aiPersona: string;
  targetAudience: string[];
  desiredTone: string;
  interpersonalStance: string;
}

export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

export interface PromptVersion {
  version: number;
  promptText: string;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  exampleOutput?: string;
  notes?: string;
  sourceDocument?: {
    name: string;
    content: string;
  };
  createdAt: string; // The date this version was created
}

export interface PromptSFL {
  id: string;
  title: string;
  promptText: string;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  exampleOutput?: string;
  notes?: string;
  createdAt: string; // ISO string for the very first version
  updatedAt: string; // ISO string for the latest update
  geminiResponse?: string;
  geminiTestError?: string;
  isTesting?: boolean;
  sourceDocument?: {
    name: string;
    content: string;
  };
  // Add versioning fields
  version: number;
  history: PromptVersion[];
}


export interface Filters {
  searchTerm: string;
  topic: string;
  taskType: string;
  aiPersona: string;
  outputFormat: string;
}

export enum ModalType {
  NONE,
  CREATE_EDIT_PROMPT,
  VIEW_PROMPT_DETAIL,
  WIZARD,
  HELP,
  WORKFLOW_EDITOR,
  WORKFLOW_WIZARD,
  TASK_DETAIL,
}

// --- PROMPT LAB TYPES ---

export enum TaskType {
  DATA_INPUT = "DATA_INPUT",
  GEMINI_PROMPT = "GEMINI_PROMPT",
  IMAGE_ANALYSIS = "IMAGE_ANALYSIS",
  TEXT_MANIPULATION = "TEXT_MANIPULATION",
  SIMULATE_PROCESS = "SIMULATE_PROCESS",
  DISPLAY_CHART = "DISPLAY_CHART",
  GEMINI_GROUNDED = "GEMINI_GROUNDED",
}

export enum TaskStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  systemInstruction?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  dependencies: string[];
  inputKeys: string[];
  outputKey: string;
  promptId?: string; // Link to a prompt in the SFL library
  promptTemplate?: string;
  agentConfig?: AgentConfig;
  functionBody?: string; // For TEXT_MANIPULATION
  staticValue?: any; // For DATA_INPUT
  dataKey?: string; // For DISPLAY_CHART
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  isDefault?: boolean; // To differentiate between default and user-created workflows
}

export type DataStore = Record<string, any>;

export interface TaskState {
  status: TaskStatus;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export type TaskStateMap = Record<string, TaskState>;

export interface StagedUserInput {
    text?: string;
    image?: {
        name: string;
        type: string;
        base64: string;
    };
    file?: {
        name: string;
        content: string;
    }
}

export type TranscriptEntry = { speaker: 'user' | 'model' | 'system'; text: string };