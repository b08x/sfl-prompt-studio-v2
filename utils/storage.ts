import { PromptSFL } from '../types';

const INDEX_KEY = 'sfl_prompt_index';
const PROMPT_PREFIX = 'sfl_prompt_';

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
  }
};