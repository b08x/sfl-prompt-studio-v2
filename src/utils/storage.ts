
import { PromptSFL, Workflow } from '../types';

const INDEX_KEY = 'sfl_prompt_index';
const PROMPT_PREFIX = 'sfl_prompt_';
const WORKFLOWS_KEY = 'sfl-custom-workflows';

export const storage = {
  getPromptIds: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    } catch {
      return [];
    }
  },

  savePromptIds: (ids: string[]) => {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  },

  getPrompt: (id: string): PromptSFL | null => {
    try {
      const data = localStorage.getItem(`${PROMPT_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  savePrompt: (prompt: PromptSFL) => {
    localStorage.setItem(`${PROMPT_PREFIX}${prompt.id}`, JSON.stringify(prompt));
  },

  deletePrompt: (id: string) => {
    localStorage.removeItem(`${PROMPT_PREFIX}${id}`);
  },

  getAllPrompts: (): PromptSFL[] => {
    const ids = storage.getPromptIds();
    const prompts: PromptSFL[] = [];
    const validIds: string[] = [];
    
    ids.forEach(id => {
      const p = storage.getPrompt(id);
      if (p) {
        prompts.push(p);
        validIds.push(id);
      }
    });

    // Heal index if needed (e.g. if some keys were manually deleted from LS)
    if (validIds.length !== ids.length) {
      storage.savePromptIds(validIds);
    }
    
    return prompts.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Workflow Storage (Simple Key for now as workflows are generally fewer/smaller than prompts history)
  getCustomWorkflows: (): Workflow[] => {
      try {
          const data = localStorage.getItem(WORKFLOWS_KEY);
          return data ? JSON.parse(data) : [];
      } catch {
          return [];
      }
  },

  saveCustomWorkflows: (workflows: Workflow[]) => {
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  }
};
