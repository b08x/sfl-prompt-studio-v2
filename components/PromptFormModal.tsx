
import React, { useState, useEffect, useRef } from 'react';
import { PromptSFL, SFLField, SFLTenor, SFLMode, PromptVersion, SFLAnalysis } from '../types';
import { TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, INITIAL_PROMPT_SFL } from '../constants';
import ModalShell from './ModalShell';
import { regenerateSFLFromSuggestion } from '../services/geminiService';
import { analyzeSFLWithGemini } from '../services/sflValidator';
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
  const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>>(INITIAL_PROMPT_SFL);
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  const [regenState, setRegenState] = useState({ shown: false, suggestion: '', loading: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sflAnalysis, setSflAnalysis] = useState<SFLAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const analysisTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (promptToEdit) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, geminiResponse, geminiTestError, isTesting, version, history, ...editableData } = promptToEdit;
      setFormData(editableData);
    } else {
      setFormData(INITIAL_PROMPT_SFL);
    }
     setRegenState({ shown: false, suggestion: '', loading: false });
     setSflAnalysis(null); // Reset analysis on open
     setIsFixing(false);
  }, [promptToEdit, isOpen]);
  
  // Debounced AI-powered SFL analysis
  useEffect(() => {
    if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
    }
    
    // Don't analyze the initial empty prompt on create
    if (!formData.title && !formData.promptText) {
        setSflAnalysis(null);
        setIsAnalyzing(false);
        return;
    }

    setIsAnalyzing(true);
    
    analysisTimeoutRef.current = window.setTimeout(async () => {
        try {
            const promptForAnalysis = { ...INITIAL_PROMPT_SFL, ...formData };
            const analysis = await analyzeSFLWithGemini(promptForAnalysis);
            setSflAnalysis(analysis);
        } catch (error) {
            console.error("Analysis failed", error);
            setSflAnalysis({
                score: 0,
                assessment: "Failed to analyze.",
                issues: [{
                    severity: 'error',
                    component: 'System',
                    message: 'Could not connect to the analysis service.',
                    suggestion: 'Check your connection or try again later.'
                }]
            });
        } finally {
            setIsAnalyzing(false);
        }
    }, 1000); // 1-second debounce

    return () => {
        if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
        }
    };
  }, [formData]);


  const handleChange = <T extends keyof Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'sflField' | 'sflTenor' | 'sflMode' | 'geminiResponse' | 'geminiTestError' | 'isTesting' | 'version' | 'history'>>(
    field: T,
    value: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>[T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSFLChange = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K,
    field: F,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [sflType]: {
        ...prev[sflType],
        [field]: value,
      },
    }));
  };
  
  const handleTargetAudienceChange = (audience: string) => {
    const currentAudiences = formData.sflTenor.targetAudience || [];
    const newAudiences = currentAudiences.includes(audience)
      ? currentAudiences.filter(a => a !== audience)
      : [...currentAudiences, audience];
    handleSFLChange('sflTenor', 'targetAudience', newAudiences);
  };

  const handleAddNewOption = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K]
  >(constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => {
    const value = newOptionValues[String(fieldKey)];
    if(value && value.trim()){
      onAddConstant(constantsKey, value);
      handleSFLChange(sflKey, fieldKey, value);
      setNewOptionValues(prev => ({...prev, [String(fieldKey)]: ''}));
    }
  };

  const handleRegeneratePrompt = async () => {
    if (!regenState.suggestion.trim()) return;
    setRegenState(prev => ({ ...prev, loading: true }));
    try {
      // FIX: The `regenerateSFLFromSuggestion` function expects a more complete prompt object,
      // including versioning information. We construct it here before passing it.
      const promptForRegeneration = {
        ...formData,
        version: promptToEdit?.version ?? 1,
        history: promptToEdit?.history ?? [],
      };
      const regeneratedData = await regenerateSFLFromSuggestion(promptForRegeneration, regenState.suggestion);
      setFormData(regeneratedData);
      setRegenState({ shown: false, suggestion: '', loading: false });
    } catch (error) {
      console.error(error);
      alert('Failed to regenerate prompt: ' + (error instanceof Error ? error.message : String(error)));
      setRegenState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAutoFix = async () => {
    if (!sflAnalysis || sflAnalysis.issues.length === 0) return;
    
    setIsFixing(true);
    try {
        const issuesText = sflAnalysis.issues
            .map(i => `- Issue in ${i.component} (${i.severity}): ${i.message}. Suggestion: ${i.suggestion}`)
            .join('\n');
            
        const suggestion = `Auto-fix request based on SFL analysis issues:\n${issuesText}\n\nPlease implement these suggestions to improve the prompt's quality, ensuring consistency across Field, Tenor, and Mode.`;

        const promptForRegeneration = {
            ...formData,
            version: promptToEdit?.version ?? 1,
            history: promptToEdit?.history ?? [],
        };
        
        const fixedData = await regenerateSFLFromSuggestion(promptForRegeneration, suggestion);
        setFormData(fixedData);
        // Re-analysis is triggered automatically by the useEffect watching formData
    } catch (error) {
        console.error("Auto-fix failed", error);
        alert("Failed to apply auto-fixes. Please review the issues manually.");
    } finally {
        setIsFixing(false);
    }
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
    // Reset file input value to allow re-uploading the same file
    if(event.target) event.target.value = '';
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({...prev, sourceDocument: undefined }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (promptToEdit) {
      // Create a version from the state *before* editing
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
        ...promptToEdit, // Carry over id, createdAt, etc.
        ...formData, // Apply the new form data
        updatedAt: now,
        version: promptToEdit.version + 1,
        history: [...(promptToEdit.history || []), previousVersion],
      };
      onSave(finalPrompt);
    } else {
      // This is a new prompt
      const finalPrompt: PromptSFL = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        version: 1, // First version
        history: [], // No history yet
        isTesting: false,
      };
      onSave(finalPrompt);
    }
    onClose();
  };


  const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

  const renderTextField = (label: string, name: keyof Omit<PromptSFL, 'id'|'createdAt'|'updatedAt'|'sflField'|'sflTenor'|'sflMode' | 'geminiResponse' | 'geminiTestError' | 'isTesting' | 'version' | 'history'>, placeholder?: string, isTextArea = false) => (
    <div>
      <label htmlFor={name} className={labelClasses}>{label}</label>
      {isTextArea ? (
        <textarea
          id={name}
          name={name}
          value={String(formData[name] || '')}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={commonInputClasses}
        />
      ) : (
        <input
          type="text"
          id={name}
          name={name}
          value={String(formData[name] || '')}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder}
          className={commonInputClasses}
        />
      )}
    </div>
  );

  const renderSFLTextField = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K, 
    name: F, 
    label: string, 
    placeholder?: string, 
    isTextArea = false
  ) => (
    <div>
      <label htmlFor={`${sflType}-${String(name)}`} className={labelClasses}>{label}</label>
      {isTextArea ? (
        <textarea
          id={`${sflType}-${String(name)}`}
          name={String(name)}
          value={String(formData[sflType][name] || '')}
          onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={commonInputClasses}
        />
      ) : (
        <input
          type="text"
          id={`${sflType}-${String(name)}`}
          name={String(name)}
          value={String(formData[sflType][name] || '')}
          onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
          placeholder={placeholder}
          className={commonInputClasses}
        />
      )}
    </div>
  );

  const renderCreatableSFLSelectField = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K, 
    name: F, 
    label: string, 
    options: string[],
    constantsKey: keyof typeof appConstants
  ) => (
    <div>
      <label htmlFor={`${sflType}-${String(name)}`} className={labelClasses}>{label}</label>
      <select
        id={`${sflType}-${String(name)}`}
        name={String(name)}
        value={String(formData[sflType][name] || '')}
        onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
        className={`${commonInputClasses} appearance-none`}
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <div className="flex items-center space-x-2 mt-2">
        <input
            type="text"
            placeholder="Add new option..."
            value={newOptionValues[String(name)] || ''}
            onChange={e => setNewOptionValues(prev => ({...prev, [String(name)]: e.target.value}))}
            className={`${commonInputClasses} text-sm`}
        />
        <button type="button" onClick={() => handleAddNewOption(constantsKey, sflType, name)} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
      </div>
    </div>
  );
  
  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-red-400';
    if (score < 80) return 'text-amber-400';
    return 'text-teal-400';
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={promptToEdit ? `Edit Prompt (Version ${promptToEdit.version + 1})` : "Create New Prompt"} size="3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.text" />
        {renderTextField('Title', 'title', 'Enter a concise title for the prompt')}
        
        <div>
            <label htmlFor="promptText" className={labelClasses}>Prompt Text</label>
            <textarea
              id="promptText"
              name="promptText"
              value={String(formData['promptText'] || '')}
              onChange={(e) => handleChange('promptText', e.target.value)}
              placeholder="Enter the full prompt text here"
              rows={4}
              className={commonInputClasses}
            />
        </div>

         <div>
          <label className={labelClasses}>Source Document (Optional)</label>
          <p className="text-xs text-gray-400 mb-2">Attach a text file for stylistic reference. Its style will be analyzed when using the AI regeneration feature.</p>
          {formData.sourceDocument ? (
            <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md border border-gray-600">
              <span className="text-sm text-gray-200 truncate pr-2">{formData.sourceDocument.name}</span>
              <button type="button" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300 shrink-0" aria-label="Remove source document">
                <XCircleIcon className="w-5 h-5"/>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center px-3 py-2 bg-gray-800 border-2 border-dashed border-gray-600 text-gray-400 rounded-md hover:bg-gray-700 hover:border-gray-500 transition-colors"
            >
              <PaperClipIcon className="w-5 h-5 mr-2" />
              Attach Document
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

        <fieldset className="border border-gray-700 p-4 rounded-md">
          <legend className="text-lg font-medium text-amber-400 px-2">SFL: Field (What is happening?)</legend>
          <div className="space-y-4 mt-2">
            {renderSFLTextField('sflField', 'topic', 'Topic', 'e.g., Quantum Physics, Recipe Generation')}
            {renderCreatableSFLSelectField('sflField', 'taskType', 'Task Type', appConstants.taskTypes, 'taskTypes')}
            {renderSFLTextField('sflField', 'domainSpecifics', 'Domain Specifics', 'e.g., Python 3.9, pandas; Italian cuisine', true)}
            {renderSFLTextField('sflField', 'keywords', 'Keywords', 'Comma-separated, e.g., sfl, linguistics, AI')}
          </div>
        </fieldset>

        <fieldset className="border border-gray-700 p-4 rounded-md">
          <legend className="text-lg font-medium text-violet-400 px-2">SFL: Tenor (Who is taking part?)</legend>
          <div className="space-y-4 mt-2">
            {renderCreatableSFLSelectField('sflTenor', 'aiPersona', 'AI Persona', appConstants.aiPersonas, 'aiPersonas')}
            
            <div>
                <label className={labelClasses}>Target Audience</label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-900">
                    {(appConstants.targetAudiences || []).map(audience => (
                        <div key={audience} className="flex items-center">
                            <input
                                id={`audience-${audience}`}
                                type="checkbox"
                                checked={(formData.sflTenor.targetAudience || []).includes(audience)}
                                onChange={() => handleTargetAudienceChange(audience)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <label htmlFor={`audience-${audience}`} className="ml-2 text-sm text-gray-300 select-none">{audience}</label>
                        </div>
                    ))}
                </div>
                 <div className="flex items-center space-x-2 mt-2">
                    <input type="text" placeholder="Add new audience..." value={newOptionValues['targetAudience'] || ''} onChange={e => setNewOptionValues(prev => ({...prev, 'targetAudience': e.target.value}))} className={`${commonInputClasses} text-sm`} />
                    <button type="button" onClick={() => {
                        const value = newOptionValues['targetAudience'];
                        if(value && value.trim()){
                            onAddConstant('targetAudiences', value);
                            handleTargetAudienceChange(value);
                            setNewOptionValues(prev => ({...prev, 'targetAudience': ''}));
                        }
                    }} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
                </div>
            </div>

            {renderCreatableSFLSelectField('sflTenor', 'desiredTone', 'Desired Tone', appConstants.desiredTones, 'desiredTones')}
            {renderSFLTextField('sflTenor', 'interpersonalStance', 'Interpersonal Stance', 'e.g., Act as a mentor, Be a collaborative partner', true)}
          </div>
        </fieldset>

        <fieldset className="border border-gray-700 p-4 rounded-md">
          <legend className="text-lg font-medium text-pink-400 px-2">SFL: Mode (What role is language playing?)</legend>
          <div className="space-y-4 mt-2">
            {renderCreatableSFLSelectField('sflMode', 'outputFormat', 'Output Format', appConstants.outputFormats, 'outputFormats')}
            {renderSFLTextField('sflMode', 'rhetoricalStructure', 'Rhetorical Structure', 'e.g., Intro, 3 points, conclusion; Problem-Solution', true)}
            {renderCreatableSFLSelectField('sflMode', 'lengthConstraint', 'Length Constraint', appConstants.lengthConstraints, 'lengthConstraints')}
            {renderSFLTextField('sflMode', 'textualDirectives', 'Textual Directives', 'e.g., Use active voice, Avoid jargon', true)}
          </div>
        </fieldset>
        
        <div>
            <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
            <textarea id="exampleOutput" name="exampleOutput" value={formData.exampleOutput || ''} onChange={e => handleChange('exampleOutput', e.target.value)} placeholder="Provide an example of a good response" rows={3} className={commonInputClasses} />
        </div>

        {renderTextField('Notes (Optional)', 'notes', 'Your private notes about this prompt', true)}

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
                    <button
                        type="button"
                        onClick={handleAutoFix}
                        disabled={isFixing}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isFixing ? (
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                            <WrenchScrewdriverIcon className="w-4 h-4" />
                        )}
                        <span>{isFixing ? 'Applying Fixes...' : 'Auto-Fix All Issues'}</span>
                    </button>
                </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            {promptToEdit ? 'Save Changes' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default PromptFormModal;
