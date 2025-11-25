
import React, { useState, useEffect, useRef } from 'react';
import { PromptSFL, PromptVersion } from '../types';
import { INITIAL_PROMPT_SFL } from '../constants';
import { usePromptAI } from '../hooks/usePromptAI';
import SFLFieldSection from './forms/SFLFieldSection';
import SFLTenorSection from './forms/SFLTenorSection';
import SFLModeSection from './forms/SFLModeSection';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: PromptSFL) => void;
  promptToEdit?: PromptSFL | null;
  appConstants: {
    taskTypes: string[];
    aiPersonas: string[];
    targetAudiences: string[];
    desiredTones: string[];
    outputFormats: string[];
    lengthConstraints: string[];
  };
  onAddConstant: (key: keyof PromptFormModalProps['appConstants'], value: string) => void;
}

const PromptFormModal: React.FC<PromptFormModalProps> = ({ isOpen, onClose, onSave, promptToEdit, appConstants, onAddConstant }) => {
  const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history' | 'sflAnalysis'>>(INITIAL_PROMPT_SFL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hook for AI logic
  const { 
    sflAnalysis, 
    isAnalyzing, 
    isFixing, 
    regenState, 
    setRegenState, 
    handleRegeneratePrompt, 
    handleAutoFix 
  } = usePromptAI({ formData, setFormData, promptToEdit });

  useEffect(() => {
    if (promptToEdit) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, geminiResponse, geminiTestError, isTesting, version, history, sflAnalysis: existingAnalysis, ...editableData } = promptToEdit;
      setFormData(editableData);
    } else {
      setFormData(INITIAL_PROMPT_SFL);
    }
  }, [promptToEdit, isOpen]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSFLChange = (sflType: 'sflField' | 'sflTenor' | 'sflMode', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sflType]: {
        ...prev[sflType],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, sourceDocument: { name: file.name, content } }));
      };
      reader.readAsText(file);
    }
    if(event.target) event.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (promptToEdit) {
      const previousVersion: PromptVersion = {
        version: promptToEdit.version,
        promptText: promptToEdit.promptText,
        sflField: promptToEdit.sflField,
        sflTenor: promptToEdit.sflTenor,
        sflMode: promptToEdit.sflMode,
        exampleOutput: promptToEdit.exampleOutput,
        notes: promptToEdit.notes,
        sourceDocument: promptToEdit.sourceDocument,
        createdAt: promptToEdit.updatedAt,
      };

      const finalPrompt: PromptSFL = {
        ...promptToEdit, 
        ...formData, 
        updatedAt: now,
        version: promptToEdit.version + 1,
        history: [...(promptToEdit.history || []), previousVersion],
        sflAnalysis: sflAnalysis || undefined,
      };
      onSave(finalPrompt);
    } else {
      const finalPrompt: PromptSFL = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        version: 1, 
        history: [], 
        isTesting: false,
        sflAnalysis: sflAnalysis || undefined, 
      };
      onSave(finalPrompt);
    }
    onClose();
  };

  const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  
  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-red-400';
    if (score < 80) return 'text-amber-400';
    return 'text-teal-400';
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={promptToEdit ? `Edit Prompt (Version ${promptToEdit.version + 1})` : "Create New Prompt"} size="3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.text" />
        
        <div>
          <label htmlFor="title" className={labelClasses}>Title</label>
          <input type="text" id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Enter a concise title" className={commonInputClasses} />
        </div>
        
        <div>
            <label htmlFor="promptText" className={labelClasses}>Prompt Text</label>
            <textarea id="promptText" value={formData.promptText} onChange={(e) => handleChange('promptText', e.target.value)} placeholder="Enter the full prompt text here" rows={4} className={commonInputClasses} />
        </div>

         <div>
          <label className={labelClasses}>Source Document (Optional)</label>
          <p className="text-xs text-gray-400 mb-2">Attach a text file for stylistic reference.</p>
          {formData.sourceDocument ? (
            <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md border border-gray-600">
              <span className="text-sm text-gray-200 truncate pr-2">{formData.sourceDocument.name}</span>
              <button type="button" onClick={() => setFormData(prev => ({...prev, sourceDocument: undefined }))} className="text-red-400 hover:text-red-300 shrink-0"><XCircleIcon className="w-5 h-5"/></button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center px-3 py-2 bg-gray-800 border-2 border-dashed border-gray-600 text-gray-400 rounded-md hover:bg-gray-700 hover:border-gray-500 transition-colors">
              <PaperClipIcon className="w-5 h-5 mr-2" /> Attach Document
            </button>
          )}
        </div>

        <div className="my-2 text-right">
          <button type="button" onClick={() => setRegenState(prev => ({...prev, shown: !prev.shown, suggestion: ''}))} className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-end">
              <SparklesIcon className="w-5 h-5 mr-1"/> Regenerate Prompt with AI
          </button>
        </div>
        
        {regenState.shown && (
            <div className="space-y-2 p-3 bg-gray-900 rounded-md border border-gray-700">
                <label htmlFor="regenSuggestion" className={`${labelClasses} text-gray-200`}>How should this prompt be changed?</label>
                <textarea id="regenSuggestion" value={regenState.suggestion} onChange={e => setRegenState(prev => ({...prev, suggestion: e.target.value}))} rows={2} placeholder="e.g., Make the tone more formal, target it to experts..." className={commonInputClasses} />
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setRegenState({ shown: false, suggestion: '', loading: false })} className="px-3 py-1 text-xs bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500">Cancel</button>
                    <button type="button" onClick={handleRegeneratePrompt} disabled={regenState.loading || !regenState.suggestion.trim()} className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center">
                        {regenState.loading && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>}
                        {regenState.loading ? 'Regenerating...' : 'Regenerate'}
                    </button>
                </div>
            </div>
        )}

        <SFLFieldSection 
          sflField={formData.sflField} 
          onChange={(field, value) => handleSFLChange('sflField', field as string, value)} 
          appConstants={appConstants} 
          onAddConstant={onAddConstant} 
        />

        <SFLTenorSection 
          sflTenor={formData.sflTenor} 
          onChange={(field, value) => handleSFLChange('sflTenor', field as string, value)} 
          appConstants={appConstants} 
          onAddConstant={onAddConstant} 
        />

        <SFLModeSection 
          sflMode={formData.sflMode} 
          onChange={(field, value) => handleSFLChange('sflMode', field as string, value)} 
          appConstants={appConstants} 
          onAddConstant={onAddConstant} 
        />
        
        <div>
            <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
            <textarea id="exampleOutput" value={formData.exampleOutput || ''} onChange={e => handleChange('exampleOutput', e.target.value)} placeholder="Provide an example of a good response" rows={3} className={commonInputClasses} />
        </div>

        <div>
            <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
            <textarea id="notes" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} rows={3} className={commonInputClasses} />
        </div>

        {(isAnalyzing || sflAnalysis) && (
          <div className="mt-6 p-4 border border-gray-700 bg-gray-900/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-400"/>
                    <h4 className="font-semibold text-blue-300">Prompt Analysis</h4>
                </div>
                <div className="flex items-center space-x-2">
                    {isAnalyzing && <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>}
                    {sflAnalysis && <span className={`text-lg font-bold ${getScoreColor(sflAnalysis.score)}`}>{sflAnalysis.score} / 100</span>}
                </div>
            </div>
            {sflAnalysis && <p className="text-sm italic text-gray-400">"{sflAnalysis.assessment}"</p>}
            
            {sflAnalysis && sflAnalysis.issues.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-700">
                    {sflAnalysis.issues.map((issue, index) => (
                        <div key={index} className="text-sm p-3 rounded-md bg-gray-800 border border-gray-600">
                            <p className={`font-semibold ${issue.severity === 'error' ? 'text-red-400' : issue.severity === 'warning' ? 'text-amber-400' : 'text-sky-400'}`}>
                                {issue.severity.toUpperCase()}: {issue.component}
                            </p>
                            <p className="text-gray-300 mt-1">{issue.message}</p>
                            <p className="text-gray-400 mt-2 text-xs"><span className="font-semibold">Suggestion:</span> {issue.suggestion}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {sflAnalysis && sflAnalysis.issues.length > 0 && (
                <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleAutoFix} disabled={isFixing} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                        {isFixing ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <WrenchScrewdriverIcon className="w-4 h-4" />}
                        <span>{isFixing ? 'Applying Fixes...' : 'Auto-Fix All Issues'}</span>
                    </button>
                </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">{promptToEdit ? 'Save Changes' : 'Create Prompt'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

export default PromptFormModal;
