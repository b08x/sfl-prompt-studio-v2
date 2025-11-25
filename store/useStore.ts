import { create } from 'zustand';
import { PromptSFL, Filters, ModalType, Workflow } from '../types';
import { storage } from '../utils/storage';
import { INITIAL_FILTERS, SAMPLE_PROMPTS, POPULAR_TAGS, TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, DEFAULT_WORKFLOWS } from '../constants';

interface AppConstants {
  taskTypes: string[];
  aiPersonas: string[];
  targetAudiences: string[];
  desiredTones: string[];
  outputFormats: string[];
  lengthConstraints: string[];
  popularTags: string[];
}

interface StoreState {
  // Data
  prompts: PromptSFL[];
  workflows: Workflow[];
  filters: Filters;
  appConstants: AppConstants;
  
  // UI State
  activeModal: ModalType;
  selectedPrompt: PromptSFL | null;
  isSidebarCollapsed: boolean;
  
  // Actions
  init: () => void;
  loadPrompts: () => void;
  addPrompt: (prompt: PromptSFL) => void;
  updatePrompt: (prompt: PromptSFL) => void;
  deletePrompt: (id: string) => void;
  importPrompts: (newPrompts: PromptSFL[]) => void;
  
  // Workflow Actions
  saveWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  saveCustomWorkflows: (workflows: Workflow[]) => void;
  
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  
  setActiveModal: (modal: ModalType) => void;
  setSelectedPrompt: (prompt: PromptSFL | null) => void;
  toggleSidebar: () => void;
  
  addAppConstant: (key: keyof AppConstants, value: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  prompts: [],
  workflows: [],
  filters: INITIAL_FILTERS,
  appConstants: {
    taskTypes: TASK_TYPES,
    aiPersonas: AI_PERSONAS,
    targetAudiences: TARGET_AUDIENCES,
    desiredTones: DESIRED_TONES,
    outputFormats: OUTPUT_FORMATS,
    lengthConstraints: LENGTH_CONSTRAINTS,
    popularTags: POPULAR_TAGS,
  },
  
  activeModal: ModalType.NONE,
  selectedPrompt: null,
  isSidebarCollapsed: false,
  
  init: () => {
    // Load Prompts
    const loadedPrompts = storage.getAllPrompts();
    if (loadedPrompts.length === 0) {
        // If empty, seed with samples
        const samples = SAMPLE_PROMPTS;
        samples.forEach(p => storage.savePrompt(p));
        storage.savePromptIds(samples.map(p => p.id));
        set({ prompts: samples });
    } else {
        set({ prompts: loadedPrompts });
    }

    // Load Workflows
    const customWorkflows = storage.getCustomWorkflows();
    const defaultWorkflows = DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true }));
    // Merge defaults with custom. Note: Defaults are always fresh from constants.
    set({ workflows: [...defaultWorkflows, ...customWorkflows] });
  },

  loadPrompts: () => {
    set({ prompts: storage.getAllPrompts() });
  },

  addPrompt: (prompt) => {
    const { prompts } = get();
    // Prepend to list for UI
    const newPrompts = [prompt, ...prompts];
    
    // Save to Chunked Storage
    storage.savePrompt(prompt);
    // Update Index
    storage.savePromptIds(newPrompts.map(p => p.id));
    
    set({ prompts: newPrompts });
  },

  updatePrompt: (prompt) => {
    const { prompts, selectedPrompt } = get();
    const newPrompts = prompts.map(p => p.id === prompt.id ? prompt : p);
    
    // Save to Chunked Storage
    storage.savePrompt(prompt);
    
    set({ 
        prompts: newPrompts,
        // Update selectedPrompt if it's the one being edited
        selectedPrompt: selectedPrompt && selectedPrompt.id === prompt.id ? prompt : selectedPrompt
    });
  },

  deletePrompt: (id) => {
    const { prompts, selectedPrompt } = get();
    const newPrompts = prompts.filter(p => p.id !== id);
    
    storage.deletePrompt(id);
    storage.savePromptIds(newPrompts.map(p => p.id));
    
    set({ 
        prompts: newPrompts,
        selectedPrompt: selectedPrompt && selectedPrompt.id === id ? null : selectedPrompt,
        activeModal: selectedPrompt && selectedPrompt.id === id ? ModalType.NONE : get().activeModal
    });
  },
  
  importPrompts: (importedPrompts) => {
      const { prompts } = get();
      const existingIds = new Set(prompts.map(p => p.id));
      
      importedPrompts.forEach(p => {
          storage.savePrompt(p);
      });
      
      const newPrompts = [...prompts];
      importedPrompts.forEach(p => {
          if(!existingIds.has(p.id)){
              newPrompts.push(p);
          } else {
              const idx = newPrompts.findIndex(ex => ex.id === p.id);
              if (idx !== -1) newPrompts[idx] = p;
          }
      });
      
      // Sort
      newPrompts.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      storage.savePromptIds(newPrompts.map(p => p.id));
      set({ prompts: newPrompts });
  },

  // Workflow Actions
  saveWorkflow: (workflowToSave) => {
      const { workflows } = get();
      const newWorkflow = { ...workflowToSave, isDefault: false };
      
      const existingIndex = workflows.findIndex(wf => wf.id === newWorkflow.id && !wf.isDefault);
      let updatedWorkflows;

      if (existingIndex > -1) {
          updatedWorkflows = workflows.map(wf => wf.id === newWorkflow.id && !wf.isDefault ? newWorkflow : wf);
      } else {
          updatedWorkflows = [...workflows, newWorkflow];
      }
      
      const customOnly = updatedWorkflows.filter(wf => !wf.isDefault);
      storage.saveCustomWorkflows(customOnly);
      set({ workflows: updatedWorkflows });
  },

  deleteWorkflow: (id) => {
      const { workflows } = get();
      const updatedWorkflows = workflows.filter(wf => wf.id !== id || wf.isDefault);
      const customOnly = updatedWorkflows.filter(wf => !wf.isDefault);
      storage.saveCustomWorkflows(customOnly);
      set({ workflows: updatedWorkflows });
  },

  saveCustomWorkflows: (customWorkflows) => {
      storage.saveCustomWorkflows(customWorkflows);
      const defaultWorkflows = DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true }));
      set({ workflows: [...defaultWorkflows, ...customWorkflows] });
  },


  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: INITIAL_FILTERS }),

  setActiveModal: (modal) => set({ activeModal: modal }),
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
  toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  
  addAppConstant: (key, value) => set(state => {
      const currentValues = state.appConstants[key];
      if (!Array.isArray(currentValues)) return state;
      const lowerCaseValue = value.trim().toLowerCase();
      if (currentValues.map(v => v.toLowerCase()).includes(lowerCaseValue)) return state;
      
      return {
          appConstants: {
              ...state.appConstants,
              [key]: [...currentValues, value.trim()]
          }
      };
  })
}));