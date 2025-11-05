
import React, { useState, useCallback, useMemo } from 'react';
import { PromptSFL, Workflow, TaskType, Task } from '../../types';
import { regenerateSFLFromSuggestion } from '../../services/geminiService';
import SparklesIcon from '../icons/SparklesIcon';
import BeakerIcon from '../icons/BeakerIcon';
import WorkflowIcon from '../icons/WorkflowIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import TestResponseModal from './TestResponseModal';
import { promptToMarkdown, sanitizeFilename } from '../../utils/exportUtils';


const SFLDetail: React.FC<{ label: string, value: string | string[] | undefined }> = ({ label, value }) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    if (!displayValue) return null;
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-200">{displayValue}</p>
        </div>
    );
};

const SFLViewer: React.FC<{ prompt: PromptSFL }> = ({ prompt }) => (
    <div className="space-y-6">
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-amber-400 px-2">Field</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="Topic" value={prompt.sflField.topic} />
                <SFLDetail label="Task Type" value={prompt.sflField.taskType} />
                <SFLDetail label="Domain Specifics" value={prompt.sflField.domainSpecifics} />
                <SFLDetail label="Keywords" value={prompt.sflField.keywords} />
            </div>
        </fieldset>
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-violet-400 px-2">Tenor</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="AI Persona" value={prompt.sflTenor.aiPersona} />
                <SFLDetail label="Target Audience" value={prompt.sflTenor.targetAudience} />
                <SFLDetail label="Desired Tone" value={prompt.sflTenor.desiredTone} />
                <SFLDetail label="Interpersonal Stance" value={prompt.sflTenor.interpersonalStance} />
            </div>
        </fieldset>
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-pink-400 px-2">Mode</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="Output Format" value={prompt.sflMode.outputFormat} />
                <SFLDetail label="Rhetorical Structure" value={prompt.sflMode.rhetoricalStructure} />
                <SFLDetail label="Length Constraint" value={prompt.sflMode.lengthConstraint} />
                <SFLDetail label="Textual Directives" value={prompt.sflMode.textualDirectives} />
            </div>
        </fieldset>
    </div>
);

interface PromptRefinementStudioProps {
    prompts: PromptSFL[];
    onTestInWorkflow: (workflow: Workflow) => void;
    prompt: PromptSFL | null;
    onPromptChange: (prompt: PromptSFL) => void;
    onSelectPrompt: (promptId: string | null) => void;
}

const PromptRefinementStudio: React.FC<PromptRefinementStudioProps> = ({ 
    prompts, onTestInWorkflow, prompt, onPromptChange, onSelectPrompt 
}) => {
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isRegeneratingText, setIsRegeneratingText] = useState(false);

    const regenerateTextFromSFL = useCallback(async () => {
        if (!prompt) return;
        setIsRegeneratingText(true);
        try {
            const suggestion = "The SFL metadata has been updated. Regenerate the `promptText`, `title`, and `exampleOutput` to be fully consistent with the new SFL data. Preserve the core goal but ensure the text reflects all SFL parameters accurately.";
            const fullyRegeneratedData = await regenerateSFLFromSuggestion(prompt, suggestion);
            const updatedPrompt = {
                ...prompt,
                ...fullyRegeneratedData,
                sourceDocument: prompt.sourceDocument,
                updatedAt: new Date().toISOString(),
            };
            onPromptChange(updatedPrompt);
        } catch (error) {
            console.error("Failed to regenerate prompt:", error);
            alert("Failed to update prompt text from SFL changes.");
        } finally {
            setIsRegeneratingText(false);
        }
    }, [prompt, onPromptChange]);
    
    const handleExportMarkdown = () => {
        if (!prompt) return;
        try {
            const markdownData = promptToMarkdown(prompt);
            const blob = new Blob([markdownData], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            const sanitizedTitle = sanitizeFilename(prompt.title || "untitled");
            a.href = url;
            a.download = `sfl-prompt_${sanitizedTitle}_${date}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting prompt as markdown:", error);
            alert("An error occurred while exporting the prompt as markdown.");
        }
    };
    
    const handleTestInWorkflow = () => {
        if (!prompt) return;

        const variables = prompt.promptText.match(/{{\s*(\w+)\s*}}/g)
            ?.map(v => v.replace(/{{\s*|\s*}}/g, '')) || [];
        const uniqueVars: string[] = [...new Set<string>(variables)];

        const mainInputVar = uniqueVars.length > 0 ? uniqueVars[0] : 'mainInput';
        const requiresInput = uniqueVars.length > 0;
        
        const promptTask: Task = {
            id: 'task-2-prompt',
            name: prompt.title,
            description: 'Executes the SFL prompt from the ideation studio.',
            type: TaskType.GEMINI_PROMPT,
            dependencies: requiresInput ? ['task-1-input'] : [],
            inputKeys: requiresInput ? [mainInputVar] : [],
            outputKey: 'promptResult',
            promptId: prompt.id,
        };

        const workflow: Workflow = {
            id: `wf-test-${prompt.id.slice(0, 8)}`,
            name: `Test: ${prompt.title}`,
            description: `A temporary workflow to test the '${prompt.title}' prompt.`,
            tasks: requiresInput ? [
                {
                    id: 'task-1-input',
                    name: 'User Input',
                    description: `Accepts text input from the user for the {{${mainInputVar}}} variable.`,
                    type: TaskType.DATA_INPUT,
                    dependencies: [],
                    inputKeys: ['userInput.text'],
                    outputKey: mainInputVar,
                    staticValue: '{{userInput.text}}'
                },
                promptTask
            ] : [promptTask],
            isDefault: false,
        };
        onTestInWorkflow(workflow);
    };

    return (
      <>
        <div className="flex flex-col h-full bg-gray-800/50">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-400 mb-1">Select Prompt to Refine</label>
                <select
                    id="prompt-select"
                    value={prompt?.id || ''}
                    onChange={(e) => onSelectPrompt(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
            </div>
            <div className="p-4 overflow-y-auto flex-grow">
                {prompt ? (
                    <div className="space-y-6">
                        <SFLViewer prompt={prompt} />
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-200">Prompt Text</h3>
                                <button 
                                    onClick={regenerateTextFromSFL}
                                    disabled={isRegeneratingText}
                                    className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    title="Regenerate prompt text from SFL metadata"
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${isRegeneratingText ? 'animate-spin' : ''}`} />
                                    <span>Update from SFL</span>
                                </button>
                            </div>
                            <div className="relative">
                                {isRegeneratingText && (
                                    <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-md z-10">
                                        <div className="spinner"></div>
                                    </div>
                                )}
                                <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all border border-gray-700 min-h-[120px]">
                                    {prompt.promptText}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : <p className="text-gray-400 text-center pt-10">Select a prompt to begin refining with the Live Assistant.</p>}
            </div>
             <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-900/50 flex items-center justify-end space-x-3">
                <button
                    onClick={() => setIsTestModalOpen(true)}
                    disabled={!prompt}
                    className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                    title="Test prompt response"
                >
                    <BeakerIcon className="w-4 h-4" />
                    <span>Test Response</span>
                </button>
                <button
                     onClick={handleTestInWorkflow}
                     disabled={!prompt}
                    className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                    title="Test prompt in a workflow"
                >
                    <WorkflowIcon className="w-4 h-4" />
                    <span>Test in Workflow</span>
                </button>
                <button
                    onClick={handleExportMarkdown}
                    disabled={!prompt}
                    className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                    title="Export as Markdown"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Export MD</span>
                </button>
            </div>
        </div>
        {isTestModalOpen && prompt && (
            <TestResponseModal 
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                prompt={prompt}
            />
        )}
      </>
    );
};

export default PromptRefinementStudio;
