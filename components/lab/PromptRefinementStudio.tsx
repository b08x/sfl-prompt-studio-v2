
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PromptSFL, SFLField, SFLTenor, SFLMode, TranscriptEntry, Workflow, TaskType, Task } from '../../types';
import { useLiveConversation } from '../../hooks/useLiveConversation';
import { regenerateSFLFromSuggestion } from '../../services/geminiService';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import StopIcon from '../icons/StopIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
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

const TranscriptViewer: React.FC<{ transcript: TranscriptEntry[] }> = ({ transcript }) => (
    <div className="space-y-4">
        {transcript.map((entry, index) => {
            if (entry.speaker === 'system') {
                return <p key={index} className="text-center text-xs text-fuchsia-400 italic py-1">-- {entry.text} --</p>;
            }
            const isUser = entry.speaker === 'user';
            const Icon = isUser ? UserCircleIcon : SparklesIcon;
            const isFinal = entry.isFinal !== false; // Default to true if undefined or true

            return (
                <div key={index} className={`flex items-start gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
                    <Icon className={`w-6 h-6 shrink-0 mt-1 ${isUser ? 'text-gray-400' : 'text-teal-400'}`} />
                    <div className={`p-3 rounded-lg max-w-sm ${isUser ? 'bg-gray-700' : 'bg-teal-900/50'}`}>
                        <p className={`text-sm text-gray-200 transition-opacity duration-300 ${isFinal ? 'opacity-100' : 'opacity-60'}`}>
                            {entry.text}
                        </p>
                    </div>
                </div>
            );
        })}
    </div>
);


interface PromptRefinementStudioProps {
    prompts: PromptSFL[];
    onTestInWorkflow: (workflow: Workflow) => void;
}

const PromptRefinementStudio: React.FC<PromptRefinementStudioProps> = ({ prompts, onTestInWorkflow }) => {
    const [selectedPromptId, setSelectedPromptId] = useState<string>(prompts[0]?.id || '');
    const [editablePrompt, setEditablePrompt] = useState<PromptSFL | null>(prompts.find(p => p.id === selectedPromptId) || null);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isRegeneratingText, setIsRegeneratingText] = useState(false);

    useEffect(() => {
        setEditablePrompt(prompts.find(p => p.id === selectedPromptId) || null);
    }, [selectedPromptId, prompts]);

    // This function is called by the live conversation hook. It ONLY updates the local SFL state.
    // It is synchronous and makes no network calls to avoid conflicts with the live audio stream.
    const handlePromptUpdateFromConversation = useCallback((updates: {
        sflField?: Partial<SFLField>;
        sflTenor?: Partial<SFLTenor>;
        sflMode?: Partial<SFLMode>;
    }) => {
        setEditablePrompt(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sflField: { ...prev.sflField, ...(updates.sflField || {}) },
                sflTenor: { ...prev.sflTenor, ...(updates.sflTenor || {}) },
                sflMode: { ...prev.sflMode, ...(updates.sflMode || {}) },
            };
        });
    }, []);

    // This function is called by the user clicking the "Update from SFL" button.
    // It performs the async network call to regenerate the prompt text.
    const regenerateTextFromSFL = useCallback(async () => {
        if (!editablePrompt) return;
        setIsRegeneratingText(true);
        try {
            const suggestion = "The SFL metadata has been updated. Regenerate the `promptText`, `title`, and `exampleOutput` to be fully consistent with the new SFL data. Preserve the core goal but ensure the text reflects all SFL parameters accurately.";
            const fullyRegeneratedData = await regenerateSFLFromSuggestion(editablePrompt, suggestion);
            setEditablePrompt(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...fullyRegeneratedData,
                    sourceDocument: prev.sourceDocument, // Preserve this
                    updatedAt: new Date().toISOString(),
                };
            });
        } catch (error) {
            console.error("Failed to regenerate prompt:", error);
            alert("Failed to update prompt text from SFL changes.");
        } finally {
            setIsRegeneratingText(false);
        }
    }, [editablePrompt]);

    const systemInstruction = useMemo(() => {
        const baseInstruction = "You are an AI assistant helping a user refine an SFL prompt. When the user asks to make a change (e.g., 'change the tone to be more formal'), use the `updatePromptComponents` tool to modify the prompt. You can ask clarifying questions if needed. Be concise and helpful.";
        
        if (!editablePrompt) {
            return baseInstruction;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, version, history, geminiResponse, geminiTestError, isTesting, ...promptForContext } = editablePrompt;

        return `${baseInstruction}\n\nHere is the current prompt you are refining:\n\n${JSON.stringify(promptForContext, null, 2)}`;
    }, [editablePrompt]);

    const { status, transcript, error, startConversation, endConversation } = useLiveConversation({
        systemInstruction,
        onUpdatePrompt: handlePromptUpdateFromConversation,
    });
    
    const isConversing = status === 'active' || status === 'connecting';
    
    const handleExportMarkdown = () => {
        if (!editablePrompt) return;
        try {
            const markdownData = promptToMarkdown(editablePrompt);
            const blob = new Blob([markdownData], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            const sanitizedTitle = sanitizeFilename(editablePrompt.title || "untitled");
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
        if (!editablePrompt) return;

        const variables = editablePrompt.promptText.match(/{{\s*(\w+)\s*}}/g)
            ?.map(v => v.replace(/{{\s*|\s*}}/g, '')) || [];
        const uniqueVars: string[] = [...new Set<string>(variables)];

        const mainInputVar = uniqueVars.length > 0 ? uniqueVars[0] : 'mainInput';
        const requiresInput = uniqueVars.length > 0;
        
        const promptTask: Task = {
            id: 'task-2-prompt',
            name: editablePrompt.title,
            description: 'Executes the SFL prompt from the ideation studio.',
            type: TaskType.GEMINI_PROMPT,
            dependencies: requiresInput ? ['task-1-input'] : [],
            inputKeys: requiresInput ? [mainInputVar] : [],
            outputKey: 'promptResult',
            promptId: editablePrompt.id,
        };

        const workflow: Workflow = {
            id: `wf-test-${editablePrompt.id.slice(0, 8)}`,
            name: `Test: ${editablePrompt.title}`,
            description: `A temporary workflow to test the '${editablePrompt.title}' prompt.`,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
            <div className="flex flex-col h-full border-r border-gray-700 bg-gray-800/50">
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-400 mb-1">Select Prompt to Refine</label>
                    <select
                        id="prompt-select"
                        value={selectedPromptId}
                        onChange={(e) => setSelectedPromptId(e.target.value)}
                        disabled={isConversing}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="p-4 overflow-y-auto flex-grow">
                    {editablePrompt ? (
                        <div className="space-y-6">
                            <SFLViewer prompt={editablePrompt} />
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-200">Prompt Text</h3>
                                    <button 
                                        onClick={regenerateTextFromSFL}
                                        disabled={isRegeneratingText || isConversing}
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
                                        {editablePrompt.promptText}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : <p className="text-gray-400">Select a prompt to begin.</p>}
                </div>
                 <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-900/50 flex items-center justify-end space-x-3">
                    <button
                        onClick={() => setIsTestModalOpen(true)}
                        disabled={!editablePrompt || isConversing}
                        className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                        title={isConversing ? "End conversation to test response" : "Test prompt response"}
                    >
                        <BeakerIcon className="w-4 h-4" />
                        <span>Test Response</span>
                    </button>
                    <button
                         onClick={handleTestInWorkflow}
                         disabled={!editablePrompt || isConversing}
                        className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                        title={isConversing ? "End conversation to test in workflow" : "Test prompt in a workflow"}
                    >
                        <WorkflowIcon className="w-4 h-4" />
                        <span>Test in Workflow</span>
                    </button>
                    <button
                        onClick={handleExportMarkdown}
                        disabled={!editablePrompt || isConversing}
                        className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                        title={isConversing ? "End conversation to export" : "Export as Markdown"}
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Export MD</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col h-full bg-gray-800">
                <div className="flex-grow p-4 overflow-y-auto">
                    {transcript.length > 0 ? (
                        <TranscriptViewer transcript={transcript} />
                    ) : (
                        <div className="text-center text-gray-500 pt-10">
                             <p>Press the microphone to start refining.</p>
                             <p className="text-xs mt-2">e.g., "Change the persona to a sarcastic bot" or "Make the output format JSON."</p>
                        </div>
                    )}
                     {error && <p className="text-red-400 text-center mt-4">Error: {error}</p>}
                </div>
                <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0 flex items-center justify-center">
                    <button
                        onClick={isConversing ? endConversation : startConversation}
                        disabled={!editablePrompt || status === 'connecting'}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors text-white ${
                            isConversing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {status === 'connecting' ? <div className="spinner w-8 h-8"/> : (isConversing ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-8 h-8"/>)}
                    </button>
                </div>
            </div>
        </div>
        {isTestModalOpen && editablePrompt && (
            <TestResponseModal 
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                prompt={editablePrompt}
            />
        )}
      </>
    );
};

export default PromptRefinementStudio;
