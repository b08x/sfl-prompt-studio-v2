
import React, { useState, useRef } from 'react';
import { PromptSFL } from '../types';
import { generateSFLFromGoal, regenerateSFLFromSuggestion, syncPromptTextFromSFL } from '../services/sflService';
import { INITIAL_PROMPT_SFL } from '../constants';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import XCircleIcon from './icons/XCircleIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { useStore } from '../store/useStore';
import { AIProvider } from '../types/ai';

interface PromptWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prompt: PromptSFL) => void;
    appConstants: {
        taskTypes: string[];
        aiPersonas: string[];
        targetAudiences: string[];
        desiredTones: string[];
        outputFormats: string[];
        lengthConstraints: string[];
    };
    onAddConstant: (key: keyof PromptWizardModalProps['appConstants'], value: string) => void;
}

type WizardStep = 'input' | 'loading' | 'refinement' | 'error';

const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ isOpen, onClose, onSave, appConstants, onAddConstant }) => {
    const { userApiKeys } = useStore();
    const [step, setStep] = useState<WizardStep>('input');
    const [goal, setGoal] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>(INITIAL_PROMPT_SFL);
    const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
    const [regenState, setRegenState] = useState({ shown: false, suggestion: '', loading: false });
    const [isUpdating, setIsUpdating] = useState(false);
    const [sourceDoc, setSourceDoc] = useState<{name: string, content: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setErrorMessage('Please enter your goal.');
            setStep('error');
            setTimeout(() => setStep('input'), 3000);
            return;
        }

        const apiKey = userApiKeys[AIProvider.Google];
        if (!apiKey) {
            setErrorMessage('Google API key is not configured. Please add your API key in Settings.');
            setStep('error');
            return;
        }

        setStep('loading');
        setErrorMessage('');

        try {
            const generatedData = await generateSFLFromGoal(goal, apiKey, sourceDoc?.content);
            setFormData({
                ...generatedData,
                sourceDocument: sourceDoc || undefined,
                originalGoal: goal
            });
            setStep('refinement');
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStep('error');
        }
    };
    
    const handleReset = () => {
        setGoal('');
        setFormData(INITIAL_PROMPT_SFL);
        setErrorMessage('');
        setStep('input');
        setRegenState({ shown: false, suggestion: '', loading: false });
        setSourceDoc(null);
    };

    const handleSave = () => {
        const now = new Date().toISOString();
        const finalPrompt: PromptSFL = {
            ...formData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
            isTesting: false,
        };
        onSave(finalPrompt);
        onClose();
    };
    
    const handleCloseAndReset = () => {
        handleReset();
        onClose();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setSourceDoc({ name: file.name, content });
            };
            reader.readAsText(file);
        }
        if(event.target) event.target.value = '';
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSFLChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const [sflType, field] = name.split('.'); 
        setFormData(prev => ({
            ...prev,
            [sflType]: {
                ...prev[sflType],
                [field]: value,
            },
        }));
    };

    const handleSFLDirectChange = <K extends 'sflField' | 'sflTenor' | 'sflMode', F extends keyof PromptSFL[K]>(sflType: K, field: F, value: any) => {
        setFormData(prev => ({
            ...prev,
            [sflType]: {
                ...prev[sflType],
                [field]: value,
            },
        }));
    }
    
    const handleTargetAudienceChange = (audience: string) => {
        const currentAudiences = formData.sflTenor.targetAudience || [];
        const newAudiences = currentAudiences.includes(audience)
          ? currentAudiences.filter(a => a !== audience)
          : [...currentAudiences, audience];
        handleSFLDirectChange('sflTenor', 'targetAudience', newAudiences);
    };

    const handleAddNewOption = <
        K extends 'sflField' | 'sflTenor' | 'sflMode',
        F extends keyof PromptSFL[K]
    >(constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => {
        const value = newOptionValues[String(fieldKey)];
        if(value && value.trim()){
          onAddConstant(constantsKey, value);
          handleSFLDirectChange(sflKey, fieldKey, value);
          setNewOptionValues(prev => ({...prev, [String(fieldKey)]: ''}));
        }
    };
    
    const handleRegeneratePrompt = async () => {
        if (!regenState.suggestion.trim()) return;

        const apiKey = userApiKeys[AIProvider.Google];
        if (!apiKey) {
            alert('Google API key is not configured. Please add your API key in Settings.');
            return;
        }

        setRegenState(prev => ({ ...prev, loading: true }));
        try {
          const result = await regenerateSFLFromSuggestion(formData, regenState.suggestion, apiKey);
          setFormData(prev => ({ ...prev, ...result }));
          setRegenState({ shown: false, suggestion: '', loading: false });
        } catch (error) {
          console.error(error);
          alert('Failed to regenerate prompt: ' + (error instanceof Error ? error.message : String(error)));
          setRegenState(prev => ({ ...prev, loading: false }));
        }
    };

    const handleSyncText = async () => {
        const apiKey = userApiKeys[AIProvider.Google];
        if (!apiKey) {
            alert('Google API key is not configured. Please add your API key in Settings.');
            return;
        }

        setIsUpdating(true);
        setErrorMessage('');
        try {
            // Decoupled Logic: Explicitly sync text from metadata using dedicated service
            const syncedData = await syncPromptTextFromSFL(formData, apiKey);
            setFormData(prev => ({ ...prev, ...syncedData }));
        } catch (error: any) {
            alert('Failed to sync prompt text: ' + (error.message || 'Unknown error'));
        } finally {
            setIsUpdating(false);
        }
    };
    
    const renderCreatableSelect = <
        K extends 'sflField' | 'sflTenor' | 'sflMode',
        F extends keyof PromptSFL[K]
    >(label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => (
        <div>
            <label className={labelClasses}>{label}</label>
            <select name={name} value={value} onChange={onChange} className={commonInputClasses}>
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
             <div className="flex items-center space-x-2 mt-2">
                <input type="text" placeholder="Add new option..." value={newOptionValues[String(fieldKey)] || ''} onChange={e => setNewOptionValues(prev => ({...prev, [String(fieldKey)]: e.target.value}))} className={`${commonInputClasses} text-sm`} />
                <button type="button" onClick={() => handleAddNewOption(constantsKey, sflKey, fieldKey)} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
            </div>
        </div>
    );


    const renderRefinementForm = () => (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
             <div>
                <label htmlFor="title" className={labelClasses}>Title</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="promptText" className={labelClasses}>Prompt Text</label>
                <textarea id="promptText" name="promptText" value={formData.promptText} onChange={handleFormChange} rows={5} className={commonInputClasses} />
            </div>
            
             {formData.sourceDocument && (
                <div>
                    <label className={labelClasses}>Source Document</label>
                     <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md border border-gray-600">
                        <span className="text-sm text-gray-200 truncate pr-2">{formData.sourceDocument.name}</span>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, sourceDocument: undefined}))} className="text-red-400 hover:text-red-300 shrink-0" aria-label="Remove source document">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}

            <div className="my-2 text-right">
                <button type="button" onClick={() => setRegenState(prev => ({...prev, shown: !prev.shown, suggestion: ''}))} className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-end">
                    <SparklesIcon className="w-5 h-5 mr-1"/> Refine with Suggestion
                </button>
            </div>
            
            {regenState.shown && (
                <div className="space-y-2 p-3 bg-gray-900 rounded-md border border-gray-700">
                    <label htmlFor="regenSuggestion-wiz" className={`${labelClasses} text-gray-200`}>How should this prompt be changed?</label>
                    <textarea id="regenSuggestion-wiz" value={regenState.suggestion} onChange={e => setRegenState(prev => ({...prev, suggestion: e.target.value}))} rows={2} placeholder="e.g., Make the tone more formal..." className={commonInputClasses} />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setRegenState({ shown: false, suggestion: '', loading: false })} className="px-3 py-1 text-xs bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="button" onClick={handleRegeneratePrompt} disabled={regenState.loading || !regenState.suggestion.trim()} className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center">
                            {regenState.loading && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>}
                            {regenState.loading ? 'Refining...' : 'Refine'}
                        </button>
                    </div>
                </div>
            )}

            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="text-lg font-medium text-amber-400 px-2">SFL: Field</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><label className={labelClasses}>Topic</label><input type="text" name="sflField.topic" value={formData.sflField.topic} onChange={handleSFLChange} className={commonInputClasses}/></div>
                {renderCreatableSelect('Task Type', 'sflField.taskType', formData.sflField.taskType, handleSFLChange, appConstants.taskTypes, 'taskTypes', 'sflField', 'taskType')}
                <div className="md:col-span-2"><label className={labelClasses}>Domain Specifics</label><input type="text" name="sflField.domainSpecifics" value={formData.sflField.domainSpecifics} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Keywords</label><input type="text" name="sflField.keywords" value={formData.sflField.keywords} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>
            
            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="text-lg font-medium text-violet-400 px-2">SFL: Tenor</legend>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {renderCreatableSelect('AI Persona', 'sflTenor.aiPersona', formData.sflTenor.aiPersona, handleSFLChange, appConstants.aiPersonas, 'aiPersonas', 'sflTenor', 'aiPersona')}
                {renderCreatableSelect('Desired Tone', 'sflTenor.desiredTone', formData.sflTenor.desiredTone, handleSFLChange, appConstants.desiredTones, 'desiredTones', 'sflTenor', 'desiredTone')}
                <div className="md:col-span-2">
                     <label className={labelClasses}>Target Audience</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 max-h-40 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-900">
                        {(appConstants.targetAudiences || []).map(audience => (
                            <div key={audience} className="flex items-center">
                                <input id={`wiz-audience-${audience}`} type="checkbox" checked={(formData.sflTenor.targetAudience || []).includes(audience)} onChange={() => handleTargetAudienceChange(audience)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
                                <label htmlFor={`wiz-audience-${audience}`} className="ml-2 text-sm text-gray-300 select-none">{audience}</label>
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
                <div className="md:col-span-2"><label className={labelClasses}>Interpersonal Stance</label><input type="text" name="sflTenor.interpersonalStance" value={formData.sflTenor.interpersonalStance} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="text-lg font-medium text-pink-400 px-2">SFL: Mode</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {renderCreatableSelect('Output Format', 'sflMode.outputFormat', formData.sflMode.outputFormat, handleSFLChange, appConstants.outputFormats, 'outputFormats', 'sflMode', 'outputFormat')}
                {renderCreatableSelect('Length Constraint', 'sflMode.lengthConstraint', formData.sflMode.lengthConstraint, handleSFLChange, appConstants.lengthConstraints, 'lengthConstraints', 'sflMode', 'lengthConstraint')}
                <div className="md:col-span-2"><label className={labelClasses}>Rhetorical Structure</label><input type="text" name="sflMode.rhetoricalStructure" value={formData.sflMode.rhetoricalStructure} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Textual Directives</label><input type="text" name="sflMode.textualDirectives" value={formData.sflMode.textualDirectives} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <div>
                <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
                <textarea id="exampleOutput" name="exampleOutput" value={formData.exampleOutput || ''} onChange={handleFormChange} rows={3} className={commonInputClasses} />
            </div>
            
            <div>
                <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
                <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleFormChange} rows={2} className={commonInputClasses} />
            </div>
        </form>
    );

    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.text"/>
                        <div>
                            <label htmlFor="goal" className="block text-lg text-gray-200 mb-2">Describe your prompt's goal</label>
                            <textarea
                                id="goal"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., I want a short, funny poem about a cat who is a senior software engineer."
                                rows={6}
                                className={commonInputClasses}
                                aria-label="Your prompt goal"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Source Document (Optional)</label>
                            <p className="text-xs text-gray-400 mb-2">Attach a text file for stylistic reference. The AI will analyze its style to generate the prompt.</p>
                            {sourceDoc ? (
                                <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md border border-gray-600">
                                <span className="text-sm text-gray-200 truncate pr-2">{sourceDoc.name}</span>
                                <button type="button" onClick={() => setSourceDoc(null)} className="text-red-400 hover:text-red-300 shrink-0" aria-label="Remove source document">
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
                         <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCloseAndReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">Generate SFL Prompt</button>
                        </div>
                    </form>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                        <div className="spinner mb-4"></div>
                        <p className="text-lg text-gray-50">Generating SFL structure...</p>
                        <p className="text-gray-400 text-sm">This may take a moment.</p>
                    </div>
                );
            case 'refinement':
                return (
                   <div className="space-y-6">
                       {renderRefinementForm()}
                       <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
                            <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Start Over</button>
                            <button
                                type="button"
                                onClick={handleSyncText}
                                disabled={isUpdating}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:bg-opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>}
                                {!isUpdating && <ArrowPathIcon className="w-5 h-5 mr-2" />}
                                {isUpdating ? 'Syncing...' : 'Sync Text to Metadata'}
                            </button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">Save Prompt</button>
                       </div>
                   </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-900/50 border border-red-700 rounded-lg">
                        <h4 className="text-lg font-bold text-red-300 mb-2">Error</h4>
                        <p className="text-red-400 mb-4">{errorMessage}</p>
                        <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Try Again</button>
                    </div>
                );
        }
    };

    return (
        <ModalShell isOpen={isOpen} onClose={handleCloseAndReset} title="Prompt Wizard" size="4xl">
            {renderContent()}
        </ModalShell>
    );
};

export default PromptWizardModal;
